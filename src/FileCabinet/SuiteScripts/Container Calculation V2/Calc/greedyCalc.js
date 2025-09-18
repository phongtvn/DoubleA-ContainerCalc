/**
 * @NApiVersion 2.1
 */
define(['N/file'], function (file) {
    
    /**
     * Container Loading Calculator with Unified Sequential Filling
     * Simplified approach: Always use sequential filling for any number of containers
     * Updated: Assumes all variants have the same pallet type
     */
    
    const imgurl = "https://sca.doubleapaper.com/assets/Container_Image/container.png";
    class ContainerLoadingCalculator {
        
        
        constructor() {
            // Constructor intentionally empty since container data now comes from input
        }
        
        /**
         * Main entry point - Unified sequential approach for all cases
         */
        calculateOptimalLoading(input) {
            try {
                // Extract container data and items from the input format
                const {boxesCutsize, containerData, tolerance, action} = input;
                
                // Get the first product group to extract items
                const productGroups = Object.keys(boxesCutsize);
                if (productGroups.length === 0) {
                    return { error: "No products found in boxesCutsize" };
                }
                
                // Extract data from first product group
                const firstProductKey = productGroups[0];
                const firstProduct = boxesCutsize[firstProductKey];
                
                if (!firstProduct || !firstProduct.variants || firstProduct.variants.length === 0) {
                    return { error: "No variants found in the product group" };
                }
                
                // Use container data from top level
                if (!containerData) {
                    return { error: "Container data not found in input" };
                }
                
                // Get target weight from the product group (in tons)
                const targetWeightTons = firstProduct.weight || 0;
                const targetWeightKg = targetWeightTons * 1000; // Convert to kg
                
                // Get all variants from the product group (no pallet type grouping needed)
                const variants = {};
                
                firstProduct.variants.forEach(item => {
                    const uniqueKey = item.internalId;
                    const variant = {
                        internalId: item.internalId,
                        product: item.product,
                        displayName: item.displayName,
                        type: item.type,
                        layer: item.layer,
                        palletType: item.palletType,
                        length: item.length,
                        width: item.width,
                        height: item.height,
                        netWeight: item.netWeightPerPallet,
                        grossWeight: item.grossWeightPerPallet,
                        uomConversionRates: item.uomConversionRates,
                        parentID: item.parentID,
                        parentName: item.parentName
                    };
                    
                    variants[uniqueKey] = variant;
                });
                
                //  log.debug('variants', variants);
                
                // Use sequential filling directly on all variants
                const solution = this.trySequentialContainers(
                    targetWeightKg,
                    variants,
                    containerData,
                    tolerance
                );
                
                // log.debug('solution', solution);
                
                if (solution.feasible) {
                    return this.generateSequentialOutput(solution, containerData, variants, action, tolerance);
                }
                
                // Return error if no solution found
                return {
                    error: "No feasible solution found"
                };
                
            } catch (error) {
                log.error('Container Loading Error', error);
                return {
                    error: error.message,
                    stack: error.stack
                };
            }
        }
        
        /**
         * Unified sequential container filling - handles 1, 2, or many containers
         */
        trySequentialContainers(targetWeightKg, variants, containerData, tolerance) {
            const containers = [];
            let remainingWeight = targetWeightKg;
            let containerIndex = 1;
            
            const toleranceDecimal = this.parseTolerancePercent(tolerance);
            
            // Calculate capacities once for reuse
            const variantCapacities = {};
            Object.keys(variants).forEach(variantKey => {
                const capacity = this.calculateMaxPalletsPerContainer(containerData, variants[variantKey]);
                variantCapacities[variantKey] = capacity;
            });
            
            // Calculate mixed loading capacity once for reuse
            const mixedCapacity = this.calculateMixedLoading(containerData, variants);
            
            // Sequential filling loop - continue until truly cannot fill more efficiently
            while (remainingWeight > 0) {
                const containerResult = this.fillSingleContainerOptimal(
                    remainingWeight,
                    variants,
                    variantCapacities,
                    mixedCapacity,
                    containerIndex
                );
                
                if (containerResult.feasible && containerResult.container.totalNetWeight > 0) {
                    containers.push(containerResult.container);
                    remainingWeight -= containerResult.container.totalNetWeight;
                    containerIndex++;
                    
                    // Smart stopping logic: Consider both tolerance and efficiency
                    const shortfallPercent = remainingWeight / targetWeightKg;
                    
                    // Stop if shortfall is within tolerance (business acceptable)
                    if (shortfallPercent <= toleranceDecimal) {
                        // log.debug('Shortfall within tolerance, stopping', {
                        //     remainingWeight: remainingWeight,
                        //     shortfallPercent: (shortfallPercent * 100).toFixed(2) + '%',
                        //     tolerance: (toleranceDecimal * 100).toFixed(1) + '%'
                        // });
                        break;
                    }
                    
                    // Stop if remaining weight is truly negligible (< 1% of total target)
                    if (remainingWeight <= targetWeightKg * 0.01) {
                        // log.debug('Remaining weight negligible, stopping', {
                        //     remainingWeight: remainingWeight,
                        //     percentOfTotal: (remainingWeight / targetWeightKg * 100).toFixed(2) + '%'
                        // });
                        break;
                    }
                } else {
                    // Cannot fill any more containers efficiently
                    log.debug('Cannot fill additional container', {
                        remainingWeight: remainingWeight,
                        containerIndex: containerIndex
                    });
                    break;
                }
            }
            
            const totalWeight = containers.reduce((sum, c) => sum + c.totalNetWeight, 0);
            
            // Calculate final metrics
            let finalExcess = 0;
            let finalShortfall = 0;
            
            if (totalWeight >= targetWeightKg) {
                finalExcess = totalWeight - targetWeightKg;
            } else {
                finalShortfall = targetWeightKg - totalWeight;
            }
            
            // Evaluate solution quality using tolerance
            const shortfallPercent = finalShortfall / targetWeightKg;
            const excessPercent = finalExcess / targetWeightKg;
            const withinTolerance = shortfallPercent <= toleranceDecimal || excessPercent <= toleranceDecimal;
            
            return {
                feasible: containers.length > 0,
                solution: {
                    type: 'sequential_containers',
                    containers: containers,
                    totalWeight: totalWeight,
                    totalExcess: finalExcess,
                    totalShortfall: finalShortfall,
                    containerCount: containers.length,
                    remainingWeight: Math.max(0, remainingWeight),
                    withinTolerance: withinTolerance,
                    solutionQuality: this.evaluateSolutionQuality(shortfallPercent, excessPercent, toleranceDecimal)
                }
            };
        }
        
        /**
         * Fill a single container optimally for given target weight
         */
        fillSingleContainerOptimal(targetWeight, variants, variantCapacities, mixedCapacity, containerIndex) {
            let bestSolution = null;
            let minDeviation = Infinity;
            
            // Strategy 1: Try mixed loading first (prioritize maximum capacity)
            if (mixedCapacity) {
                const deviation = Math.abs(mixedCapacity.totalNetWeight - targetWeight);
                const utilizationRatio = mixedCapacity.totalNetWeight / targetWeight;
                
                // Always consider mixed loading if it's feasible
                if (utilizationRatio >= 0.05 && utilizationRatio <= 10.0) {
                    // Capacity bonus: strongly favor higher capacity solutions
                    const capacityBonus = mixedCapacity.totalNetWeight * 0.1; // 10% of weight as bonus
                    const adjustedDeviation = deviation - capacityBonus;
                    
                    if (adjustedDeviation < minDeviation) {
                        bestSolution = {
                            containerIndex: containerIndex,
                            type: 'mixed',
                            ...mixedCapacity,
                            deviation: deviation,
                            adjustedDeviation: adjustedDeviation,
                            utilizationRatio: utilizationRatio
                        };
                        minDeviation = adjustedDeviation;
                    }
                }
            }
            
            // Strategy 2: Try single variants
            Object.keys(variants).forEach(variantKey => {
                const variant = variants[variantKey];
                const capacity = variantCapacities[variantKey];
                
                if (!capacity || capacity.maxPallets === 0) return;
                
                // Calculate optimal pallets for target weight
                const idealPallets = targetWeight / variant.netWeight;
                const maxPallets = capacity.maxPallets;
                
                const palletOptions = [
                    Math.max(1, Math.floor(idealPallets)),
                    Math.max(1, Math.ceil(idealPallets)),
                    Math.max(1, Math.round(idealPallets)),
                    maxPallets // Always include maximum capacity option
                ].filter(p => p > 0 && p <= maxPallets);
                
                // Remove duplicates
                const uniquePalletOptions = [...new Set(palletOptions)];
                
                uniquePalletOptions.forEach(pallets => {
                    const actualWeight = pallets * variant.netWeight;
                    const deviation = Math.abs(actualWeight - targetWeight);
                    const utilizationRatio = actualWeight / targetWeight;
                    
                    // Capacity bonus: favor higher capacity solutions
                    const capacityBonus = actualWeight * 0.1; // 10% of weight as bonus
                    const adjustedDeviation = deviation - capacityBonus;
                    
                    if (adjustedDeviation < minDeviation) {
                        bestSolution = {
                            containerIndex: containerIndex,
                            type: 'single',
                            variant: variantKey,
                            pallets: pallets,
                            totalNetWeight: actualWeight,
                            totalGrossWeight: pallets * variant.grossWeight,
                            deviation: deviation,
                            adjustedDeviation: adjustedDeviation,
                            utilizationRatio: utilizationRatio
                        };
                        minDeviation = adjustedDeviation;
                    }
                });
            });
            
            // Strategy 3: Try partial mixed loading (different layer combinations)
            if (mixedCapacity && Object.keys(variants).length >= 2) {
                const partialMixedOptions = this.generatePartialMixedForTarget(targetWeight, variants, mixedCapacity);
                
                partialMixedOptions.forEach(option => {
                    const deviation = Math.abs(option.totalNetWeight - targetWeight);
                    const utilizationRatio = option.totalNetWeight / targetWeight;
                    
                    // Capacity bonus for partial mixed loading
                    const capacityBonus = option.totalNetWeight * 0.1;
                    const adjustedDeviation = deviation - capacityBonus;
                    
                    if (adjustedDeviation < minDeviation) {
                        bestSolution = {
                            containerIndex: containerIndex,
                            type: 'partial_mixed',
                            ...option,
                            deviation: deviation,
                            adjustedDeviation: adjustedDeviation,
                            utilizationRatio: utilizationRatio
                        };
                        minDeviation = adjustedDeviation;
                    }
                });
            }
            
            return {
                feasible: bestSolution !== null,
                container: bestSolution
            };
        }
        
        /**
         * Generate partial mixed loading options for specific target weight
         */
        generatePartialMixedForTarget(targetWeight, variants, mixedCapacity) {
            const options = [];
            const variantKeys = Object.keys(variants);
            
            if (variantKeys.length < 2 || !mixedCapacity.floorLayout) return options;
            
            const floorLayout = mixedCapacity.floorLayout;
            
            // Try different combinations with conservative layer counts
            for (let i = 0; i < variantKeys.length; i++) {
                for (let j = i + 1; j < variantKeys.length; j++) {
                    const variant1 = variants[variantKeys[i]];
                    const variant2 = variants[variantKeys[j]];
                    
                    // Sort by weight (heavier at bottom for stability)
                    const heavierVariant = variant1.grossWeight > variant2.grossWeight ? variant1 : variant2;
                    const lighterVariant = variant1.grossWeight > variant2.grossWeight ? variant2 : variant1;
                    const heavierKey = variant1.grossWeight > variant2.grossWeight ? variantKeys[i] : variantKeys[j];
                    const lighterKey = variant1.grossWeight > variant2.grossWeight ? variantKeys[j] : variantKeys[i];
                    
                    // Calculate max layers for each variant
                    const maxHeavyLayers = Math.floor(mixedCapacity.totalHeight / heavierVariant.height);
                    const maxLightLayers = Math.floor(mixedCapacity.totalHeight / lighterVariant.height);
                    
                    // Try conservative layer combinations
                    for (let heavyLayers = 0; heavyLayers <= Math.min(3, maxHeavyLayers); heavyLayers++) {
                        for (let lightLayers = 0; lightLayers <= Math.min(3, maxLightLayers); lightLayers++) {
                            if (heavyLayers === 0 && lightLayers === 0) continue;
                            
                            const totalHeight = (heavyLayers * heavierVariant.height) + (lightLayers * lighterVariant.height);
                            if (totalHeight > mixedCapacity.totalHeight) continue;
                            
                            const totalNetWeight = (heavyLayers * floorLayout.palletsPerLayer * heavierVariant.netWeight) +
                                (lightLayers * floorLayout.palletsPerLayer * lighterVariant.netWeight);
                            const totalGrossWeight = (heavyLayers * floorLayout.palletsPerLayer * heavierVariant.grossWeight) +
                                (lightLayers * floorLayout.palletsPerLayer * lighterVariant.grossWeight);
                            
                            // Check weight constraint
                            if (totalGrossWeight / 1000 > mixedCapacity.totalGrossWeight / 1000) continue;
                            
                            // Only include if reasonably close to target (within 20% to 300% of target)
                            const ratio = totalNetWeight / targetWeight;
                            if (ratio >= 0.2 && ratio <= 3.0) {
                                const layers = [];
                                
                                if (heavyLayers > 0) {
                                    layers.push({
                                        variant: heavierKey,
                                        layerCount: heavyLayers,
                                        palletsPerLayer: floorLayout.palletsPerLayer,
                                        totalPallets: heavyLayers * floorLayout.palletsPerLayer,
                                        netWeight: heavyLayers * floorLayout.palletsPerLayer * heavierVariant.netWeight,
                                        grossWeight: heavyLayers * floorLayout.palletsPerLayer * heavierVariant.grossWeight,
                                        height: heavierVariant.height,
                                        position: 'bottom'
                                    });
                                }
                                
                                if (lightLayers > 0) {
                                    layers.push({
                                        variant: lighterKey,
                                        layerCount: lightLayers,
                                        palletsPerLayer: floorLayout.palletsPerLayer,
                                        totalPallets: lightLayers * floorLayout.palletsPerLayer,
                                        netWeight: lightLayers * floorLayout.palletsPerLayer * lighterVariant.netWeight,
                                        grossWeight: lightLayers * floorLayout.palletsPerLayer * lighterVariant.grossWeight,
                                        height: lighterVariant.height,
                                        position: 'top'
                                    });
                                }
                                
                                options.push({
                                    type: 'partial_mixed',
                                    totalPallets: (heavyLayers + lightLayers) * floorLayout.palletsPerLayer,
                                    totalNetWeight: totalNetWeight,
                                    totalGrossWeight: totalGrossWeight,
                                    totalHeight: totalHeight,
                                    layers: layers,
                                    floorLayout: floorLayout
                                });
                            }
                        }
                    }
                }
            }
            
            return options;
        }
        
        /**
         * Evaluate solution quality based on tolerance
         */
        evaluateSolutionQuality(shortfallPercent, excessPercent, toleranceDecimal) {
            if (shortfallPercent <= toleranceDecimal && excessPercent <= toleranceDecimal) {
                return "EXCELLENT";
            } else if (shortfallPercent <= toleranceDecimal * 2 || excessPercent <= toleranceDecimal * 2) {
                return "GOOD";
            } else if (shortfallPercent <= toleranceDecimal * 3 || excessPercent <= toleranceDecimal * 3) {
                return "ACCEPTABLE";
            } else {
                return "REVIEW_NEEDED";
            }
        }
        
        /**
         * Generate output for sequential container solution
         */
        generateSequentialOutput(results, containerData, variants, action, tolerance) {
            const solution = results.solution;
            const containers = [];
            
            solution.containers.forEach(containerSolution => {
                const containerOutput = this.generateSingleContainerOutput(containerSolution, containerData, variants, action);
                containers.push(containerOutput);
            });
            
            // Calculate summary
            const totalWeight = containers.reduce((sum, c) => {
                return sum + c.item.reduce((itemSum, item) => itemSum + parseFloat(item.netWeight), 0);
            }, 0);
            
            const totalPallets = containers.reduce((sum, c) => {
                return sum + c.item.reduce((itemSum, item) => itemSum + parseInt(item.palletsPerContainer.split(' ')[0]), 0);
            }, 0);
            
            const totalReams = containers.reduce((sum, c) => {
                return sum + parseInt(c.totalReamsCopyPaper.split(' ')[0]);
            }, 0);
            
            const totalCartons = containers.reduce((sum, c) => {
                return sum + parseInt(c.totalBoxesCopyPaper.split(' ')[0]);
            }, 0);
            
            // Build summary with proper excess/shortfall handling
            const summary = {
                totalContainers: containers.length,
                totalWeight: `${totalWeight.toFixed(3)} tons`,
                totalPallets: `${totalPallets} PAL`,
                totalReams: `${totalReams} RM`,
                totalCartons: `${totalCartons} CAR`,
                strategy: solution.type,
                solutionQuality: solution.solutionQuality,
                withinTolerance: solution.withinTolerance
            };
            
            // Add excess or shortfall info
            if (solution.totalExcess > 0) {
                summary.totalExcess = `${(solution.totalExcess / 1000).toFixed(3)} tons`;
                summary.excessPercent = `${(solution.totalExcess / (totalWeight * 1000) * 100).toFixed(2)}%`;
            }
            
            if (solution.totalShortfall > 0) {
                summary.totalShortfall = `${(solution.totalShortfall / 1000).toFixed(3)} tons`;
                summary.shortfallPercent = `${(solution.totalShortfall / ((totalWeight * 1000) + solution.totalShortfall) * 100).toFixed(2)}%`;
            }
            
            if (solution.remainingWeight > 0) {
                summary.remainingWeight = `${(solution.remainingWeight / 1000).toFixed(3)} tons`;
            }
            
            return {
                containers: containers,
                summary: summary,
                recommendedItems: this.generateSequentialRecommendations(solution, variants, containerData, tolerance)
            };
        }
        
        /**
         * Generate output for individual container
         */
        generateSingleContainerOutput(container, containerData, variants, action) {
            if (container.type === 'mixed' || container.type === 'partial_mixed') {
                return this.generateMixedContainerOutput(container, containerData, variants, action);
            } else {
                return this.generateSingleVariantContainerOutput(container, containerData, variants, action);
            }
        }
        
        generateMixedContainerOutput(container, containerData, variants, action) {
            const totalReams = container.layers.reduce((sum, layer) => {
                const v = variants[layer.variant];
                return sum + Math.floor(layer.netWeight / v.uomConversionRates.ream);
            }, 0);
            
            const totalCartons = container.layers.reduce((sum, layer) => {
                const v = variants[layer.variant];
                return sum + Math.floor(layer.netWeight / v.uomConversionRates.carton);
            }, 0);
            
            const items = container.layers.map(layer => {
                const variant = variants[layer.variant];
                const reams = Math.floor(layer.netWeight / variant.uomConversionRates.ream);
                const cartons = Math.floor(layer.netWeight / variant.uomConversionRates.carton);
                
                return {
                    product: variant.product,
                    internalId: variant.internalId,
                    displayName: variant.displayName,
                    type: variant.type,
                    width: containerData.width,
                    height: containerData.height,
                    length: containerData.length,
                    layer: layer.layerCount,
                    netWeight: (layer.netWeight / 1000).toFixed(3),
                    netWeightKG: layer.netWeight.toFixed(3),
                    grossWeight: (layer.grossWeight / 1000).toFixed(3),
                    grossWeightKG: layer.grossWeight.toFixed(3),
                    reams: `${reams} RM`,
                    boxes: `${cartons} CAR`,
                    palletsPerContainer: `${layer.totalPallets} PAL`,
                    palletsPerLayer: `${layer.palletsPerLayer} PAL`,
                    productLayer: variant.layer,
                    price: 0
                };
            });
            
            const containerOutput = {
                containerIndex: container.containerIndex,
                imgurl: imgurl,
                containerSize: containerData,
                totalReamsCopyPaper: `${totalReams} RM`,
                totalBoxesCopyPaper: `${totalCartons} CAR`,
                totalPalletsCopyPaper: `${container.totalPallets} PAL`,
                item: items
            };
            
            if (action === 'view3D') {
                containerOutput.coordinates3D = this.generate3DCoordinates(container, containerData, variants);
            }
            
            return containerOutput;
        }
        
        generateSingleVariantContainerOutput(container, containerData, variants, action) {
            const variant = variants[container.variant];
            const reams = Math.floor(container.totalNetWeight / variant.uomConversionRates.ream);
            const cartons = Math.floor(container.totalNetWeight / variant.uomConversionRates.carton);
            
            const capacity = this.calculateMaxPalletsPerContainer(containerData, variant);
            const actualLayers = capacity.config ? Math.ceil(container.pallets / capacity.config.palletsPerLayer) : 1;
            
            const containerOutput = {
                containerIndex: container.containerIndex,
                imgurl: imgurl,
                containerSize: containerData,
                type: variant.type,
                width: containerData.width,
                height: containerData.height,
                length: containerData.length,
                totalReamsCopyPaper: `${reams} RM`,
                totalBoxesCopyPaper: `${cartons} CAR`,
                totalPalletsCopyPaper: `${container.pallets} PAL`,
                item: [{
                    product: variant.product,
                    internalId: variant.internalId,
                    displayName: variant.displayName,
                    type: variant.type,
                    layer: actualLayers,
                    netWeight: (container.totalNetWeight / 1000).toFixed(3),
                    netWeightKG: container.totalNetWeight.toFixed(3),
                    grossWeight: (container.totalGrossWeight / 1000).toFixed(3),
                    grossWeightKG: container.totalGrossWeight.toFixed(3),
                    reams: `${reams} RM`,
                    boxes: `${cartons} CAR`,
                    palletsPerContainer: `${container.pallets} PAL`,
                    palletsPerLayer: `${capacity.config ? capacity.config.palletsPerLayer : container.pallets} PAL`,
                    productLayer: variant.layer,
                    price: 0
                }]
            };
            
            if (action === 'view3D') {
                containerOutput.coordinates3D = this.generate3DCoordinates(container, containerData, variants);
            }
            
            return containerOutput;
        }
        
        /**
         * Generate recommendations for sequential solution
         */
        generateSequentialRecommendations(solution, variants, containerData, tolerance) {
            const recommendations = {};
            
            // Calculate mixed loading capacity for full containers
            const mixedCapacity = this.calculateMixedLoading(containerData, variants);
            let maxCapacityPerContainer = 0;
            
            // If mixed loading available, use it. Otherwise use single variant max capacity
            if (mixedCapacity) {
                maxCapacityPerContainer = mixedCapacity.totalNetWeight;
            } else {
                // Single variant case - get max capacity of the best variant
                const variantKeys = Object.keys(variants);
                let bestSingleCapacity = 0;
                
                variantKeys.forEach(variantKey => {
                    const capacity = this.calculateMaxPalletsPerContainer(containerData, variants[variantKey]);
                    if (capacity) {
                        const singleCapacity = capacity.maxPallets * variants[variantKey].netWeight;
                        if (singleCapacity > bestSingleCapacity) {
                            bestSingleCapacity = singleCapacity;
                        }
                    }
                });
                
                maxCapacityPerContainer = bestSingleCapacity;
            }
            
            const firstVariant = variants[Object.keys(variants)[0]];
            const currentContainers = solution.containerCount;
            const currentWeightTons = Math.floor(solution.totalWeight) / 1000;
            
            // PRIORITY 1: If we have excess weight, suggest customer to increase order to match optimal solution
            if (solution.totalExcess > 0) {
                const excessTons = solution.totalExcess / 1000;
                const excessPercent = solution.totalExcess / solution.totalWeight;
                
                // Only suggest if excess is meaningful (> 0.1% of total weight)
                if (excessPercent > 0.001) {
                    recommendations.option1 = [];
                    recommendations.option1.push({
                        type: "match_optimal_loading",
                        action: "increase",
                        internalId: firstVariant.internalId,
                        parentID: firstVariant.parentID || firstVariant.internalId,
                        displayName: firstVariant.parentName || firstVariant.displayName.split(" AUTO")[0],
                        suggestedQty: excessTons.toFixed(3),
                        uom: "MT",
                        currentWeight: (currentWeightTons - excessTons).toFixed(3),
                        targetWeight: currentWeightTons.toFixed(3),
                        containers: currentContainers,
                        utilizationStatus: "OPTIMAL",
                        note: `Increase order to ${currentWeightTons.toFixed(3)} tons to match optimal container loading solution`
                    });
                    
                    return recommendations;
                }
            }
            
            // If we have partial containers, offer clear business choices
            if (currentContainers > 0 && maxCapacityPerContainer > 0) {
                
                // OPTION 1: Increase to fill all containers optimally (full utilization)
                const fullContainersWeight = currentContainers * maxCapacityPerContainer / 1000; // tons
                const increaseNeeded = fullContainersWeight - currentWeightTons;
                
                const toleranceDecimal = this.parseTolerancePercent(tolerance);
                const ratioLack = (fullContainersWeight > 0) ? (increaseNeeded / fullContainersWeight) : 0;
                
                if (ratioLack > toleranceDecimal && increaseNeeded > 0.1) { // Only suggest if shortage exceeds tolerance and meaningful amount
                    recommendations.option1 = []
                    recommendations.option1.push({
                        type: mixedCapacity ? "optimize_full_containers" : "optimize_single_variant_containers",
                        action: "increase",
                        internalId: firstVariant.internalId,
                        parentID: firstVariant.parentID || firstVariant.internalId,
                        displayName: firstVariant.parentName || firstVariant.displayName.split(" AUTO")[0],
                        suggestedQty: increaseNeeded.toFixed(3),
                        uom: "MT",
                        targetWeight: fullContainersWeight.toFixed(3),
                        containers: currentContainers,
                        utilizationStatus: "FULL",
                        loadingType: mixedCapacity ? "mixed" : "single_variant",
                        note: `Increase to ${fullContainersWeight.toFixed(3)} tons for optimal ${currentContainers}-container utilization`
                    });
                }
            }
            
            // If no meaningful options, provide general optimization suggestions
            if (!recommendations.option1 || recommendations.option1.length === 0) {
                
                // Check if we have remaining weight worth mentioning
                if (solution.remainingWeight > 0 && solution.remainingWeight > solution.totalWeight * 0.05) {
                    const remainingTons = solution.remainingWeight / 1000;
                    
                    recommendations.option1 = []
                    recommendations.option1.push({
                        type: "complete_order",
                        action: "increase",
                        internalId: firstVariant.internalId,
                        parentID: firstVariant.parentID || firstVariant.internalId,
                        displayName: firstVariant.parentName || firstVariant.displayName.split(" AUTO")[0],
                        suggestedQty: remainingTons.toFixed(3),
                        uom: "MT",
                        note: `Add ${remainingTons.toFixed(3)} tons to complete the order`
                    });
                }
            }
            
            return recommendations;
        }
        
        // =================== EXISTING HELPER METHODS ===================
        
        parseTolerancePercent(toleranceStr) {
            if (!toleranceStr) return 0.1;
            const numStr = toleranceStr.toString().replace('%', '');
            const percent = parseFloat(numStr);
            return isNaN(percent) ? 0.1 : percent / 100;
        }
        
        calculateMaxPalletsPerContainer(containerData, variant) {
            if (!containerData) return null;
            
            const orientations = [
                { l: variant.length, w: variant.width, name: 'original' },
                { l: variant.width, w: variant.length, name: 'rotated' }
            ];
            
            let maxPallets = 0;
            let bestConfig = null;
            
            orientations.forEach(orientation => {
                const palletsPerRowLength = Math.floor(containerData.length / orientation.l);
                const palletsPerRowWidth = Math.floor(containerData.width / orientation.w);
                const palletsPerLayer = palletsPerRowLength * palletsPerRowWidth;
                const maxLayers = Math.floor(containerData.height / variant.height);
                const totalPallets = palletsPerLayer * maxLayers;
                
                const totalGrossWeight = totalPallets * variant.grossWeight / 1000;
                
                if (totalGrossWeight <= containerData.maxWeight && totalPallets > maxPallets) {
                    maxPallets = totalPallets;
                    bestConfig = {
                        palletsPerLayer: palletsPerLayer,
                        maxLayers: maxLayers,
                        orientation: `${orientation.l}x${orientation.w}`,
                        orientationName: orientation.name,
                        actualLength: orientation.l,  // Actual length used in 3D
                        actualWidth: orientation.w,   // Actual width used in 3D
                        palletsPerRowLength: palletsPerRowLength,
                        palletsPerRowWidth: palletsPerRowWidth
                    };
                }
            });
            
            return {
                maxPallets: maxPallets,
                config: bestConfig
            };
        }
        
        calculateMixedLoading(containerData, variants) {
            if (!containerData || Object.keys(variants).length < 2) return null;
            
            const variantKeys = Object.keys(variants);
            const mixedStrategies = [];
            
            // Get optimal floor layout
            const firstVariant = variants[variantKeys[0]];
            const orientations = [
                { l: firstVariant.length, w: firstVariant.width, name: 'original' },
                { l: firstVariant.width, w: firstVariant.length, name: 'rotated' }
            ];
            
            let bestFloorLayout = null;
            let maxPalletsPerLayer = 0;
            
            orientations.forEach(orientation => {
                const palletsPerRowLength = Math.floor(containerData.length / orientation.l);
                const palletsPerRowWidth = Math.floor(containerData.width / orientation.w);
                const palletsPerLayer = palletsPerRowLength * palletsPerRowWidth;
                
                if (palletsPerLayer > maxPalletsPerLayer) {
                    maxPalletsPerLayer = palletsPerLayer;
                    bestFloorLayout = {
                        palletsPerLayer,
                        orientation: `${orientation.l}x${orientation.w}`,
                        orientationName: orientation.name,
                        actualLength: orientation.l,
                        actualWidth: orientation.w,
                        palletsPerRowLength: palletsPerRowLength,
                        palletsPerRowWidth: palletsPerRowWidth
                    };
                }
            });
            
            if (!bestFloorLayout) return null;
            
            // Generate mixed loading combinations
            const maxLayersPerVariant = {};
            variantKeys.forEach(key => {
                maxLayersPerVariant[key] = Math.floor(containerData.height / variants[key].height);
            });
            
            // Test different combinations of layers
            for (let i = 0; i < variantKeys.length; i++) {
                for (let j = i + 1; j < variantKeys.length; j++) {
                    const variant1Key = variantKeys[i];
                    const variant2Key = variantKeys[j];
                    const variant1 = variants[variant1Key];
                    const variant2 = variants[variant2Key];
                    
                    // Sort variants by weight (heavier should go to bottom)
                    const heavierVariant = variant1.grossWeight > variant2.grossWeight ? variant1 : variant2;
                    const lighterVariant = variant1.grossWeight > variant2.grossWeight ? variant2 : variant1;
                    const heavierKey = variant1.grossWeight > variant2.grossWeight ? variant1Key : variant2Key;
                    const lighterKey = variant1.grossWeight > variant2.grossWeight ? variant2Key : variant1Key;
                    
                    // Try different layer distributions
                    for (let heavyLayers = 1; heavyLayers <= maxLayersPerVariant[heavierKey]; heavyLayers++) {
                        for (let lightLayers = 1; lightLayers <= maxLayersPerVariant[lighterKey]; lightLayers++) {
                            const totalHeight = (heavyLayers * heavierVariant.height) + (lightLayers * lighterVariant.height);
                            
                            if (totalHeight <= containerData.height) {
                                const totalPallets = (heavyLayers + lightLayers) * bestFloorLayout.palletsPerLayer;
                                const totalNetWeight = Math.round((heavyLayers * bestFloorLayout.palletsPerLayer * heavierVariant.netWeight) +
                                    (lightLayers * bestFloorLayout.palletsPerLayer * lighterVariant.netWeight))
                                
                                const totalGrossWeight = (heavyLayers * bestFloorLayout.palletsPerLayer * heavierVariant.grossWeight) +
                                    (lightLayers * bestFloorLayout.palletsPerLayer * lighterVariant.grossWeight);
                                
                                if (totalGrossWeight / 1000 <= containerData.maxWeight) {
                                    mixedStrategies.push({
                                        type: 'mixed',
                                        totalPallets,
                                        totalNetWeight,
                                        totalGrossWeight,
                                        totalHeight,
                                        layers: [
                                            {
                                                variant: heavierKey,
                                                layerCount: heavyLayers,
                                                palletsPerLayer: bestFloorLayout.palletsPerLayer,
                                                totalPallets: heavyLayers * bestFloorLayout.palletsPerLayer,
                                                netWeight: heavyLayers * bestFloorLayout.palletsPerLayer * heavierVariant.netWeight,
                                                grossWeight: heavyLayers * bestFloorLayout.palletsPerLayer * heavierVariant.grossWeight,
                                                height: heavierVariant.height,
                                                position: 'bottom'
                                            },
                                            {
                                                variant: lighterKey,
                                                layerCount: lightLayers,
                                                palletsPerLayer: bestFloorLayout.palletsPerLayer,
                                                totalPallets: lightLayers * bestFloorLayout.palletsPerLayer,
                                                netWeight: lightLayers * bestFloorLayout.palletsPerLayer * lighterVariant.netWeight,
                                                grossWeight: lightLayers * bestFloorLayout.palletsPerLayer * lighterVariant.grossWeight,
                                                height: lighterVariant.height,
                                                position: 'top'
                                            }
                                        ],
                                        floorLayout: bestFloorLayout
                                    });
                                }
                            }
                        }
                    }
                }
            }
            
            // Sort by total net weight (descending) to get maximum utilization
            mixedStrategies.sort((a, b) => b.totalNetWeight - a.totalNetWeight);
            
            return mixedStrategies.length > 0 ? mixedStrategies[0] : null;
        }
        
        /**
         * Generate 3D coordinates for visualization
         */
        generate3DCoordinates(container, containerData, variants) {
            const coordinates = [];
            
            if (container.type === 'mixed' || container.type === 'partial_mixed') {
                // Mixed loading - multiple variants with layers
                let currentZ = 0;
                
                // Sort layers by position (bottom to top)
                const sortedLayers = [...container.layers].sort((a, b) => {
                    return a.position === 'bottom' ? -1 : 1;
                });
                
                sortedLayers.forEach(layer => {
                    const variant = variants[layer.variant];
                    const floorLayout = container.floorLayout || this.calculateOptimalFloorLayout(variant, containerData);
                    
                    if (floorLayout) {
                        // Generate coordinates for each layer of this variant
                        for (let layerNum = 0; layerNum < layer.layerCount; layerNum++) {
                            for (let row = 0; row < floorLayout.palletsPerRowWidth; row++) {
                                for (let col = 0; col < floorLayout.palletsPerRowLength; col++) {
                                    // Use actual dimensions from floor layout
                                    const actualLength = floorLayout.actualLength;
                                    const actualWidth = floorLayout.actualWidth;
                                    
                                    // Map to container coordinate system: X=width, Z=length
                                    const x = row * actualWidth;   // row maps to container width
                                    const z = col * actualLength;  // col maps to container length
                                    const y = currentZ;
                                    
                                    coordinates.push({
                                        product: variant.product || `${variant.internalId}-product`,
                                        internalId: variant.internalId,
                                        displayName: variant.displayName,
                                        position: { x: x, y: y, z: z },
                                        originalDimensions: {
                                            width: variant.width,
                                            height: variant.height,
                                            length: variant.length,
                                            weight: Math.round(variant.netWeight / 20) // Weight per box approximation
                                        },
                                        packedDimensions: {
                                            width: actualWidth,
                                            height: variant.height,
                                            length: actualLength
                                        },
                                        remainingDimensions: {
                                            remainingWidth: (containerData.width - ((row + 1) * actualWidth)).toFixed(2),
                                            remainingHeight: (containerData.height - (y + variant.height)).toFixed(2),
                                            remainingLength: (containerData.length - ((col + 1) * actualLength)).toFixed(2)
                                        },
                                        color: layer.position === 'bottom' ? "0x191970" : "0x4169E1", // Different colors for different layers
                                        type: variant.type || "cutsize",
                                        productLayer: variant.layer,
                                        pallet: true
                                    });
                                }
                            }
                            currentZ += variant.height;
                        }
                    }
                });
            } else {
                // Single variant loading
                const variant = variants[container.variant];
                const capacity = this.calculateMaxPalletsPerContainer(containerData, variant);
                
                if (capacity && capacity.config) {
                    const palletsPerRowLength = capacity.config.palletsPerRowLength;
                    const palletsPerRowWidth = capacity.config.palletsPerRowWidth;
                    const palletsPerLayer = capacity.config.palletsPerLayer;
                    const totalLayers = Math.ceil(container.pallets / palletsPerLayer);
                    
                    // Get actual dimensions from capacity config
                    const actualLength = capacity.config.actualLength;
                    const actualWidth = capacity.config.actualWidth;
                    
                    let currentZ = 0;
                    let palletCount = 0;
                    
                    for (let layer = 0; layer < totalLayers; layer++) {
                        const palletsInThisLayer = Math.min(palletsPerLayer, container.pallets - palletCount);
                        
                        let layerPalletCount = 0;
                        for (let row = 0; row < palletsPerRowWidth && layerPalletCount < palletsInThisLayer; row++) {
                            for (let col = 0; col < palletsPerRowLength && layerPalletCount < palletsInThisLayer; col++) {
                                // Use actual dimensions based on chosen orientation
                                // Map to container coordinate system: X=width, Z=length
                                const x = row * actualWidth;   // row maps to container width
                                const z = col * actualLength;  // col maps to container length
                                const y = currentZ;
                                
                                coordinates.push({
                                    product: variant.product || `${variant.internalId}-product`,
                                    internalId: variant.internalId,
                                    displayName: variant.displayName,
                                    position: { x: x, y: y, z: z },
                                    originalDimensions: {
                                        width: variant.width,
                                        height: variant.height,
                                        length: variant.length,
                                        weight: Math.round(variant.netWeight / 20) // Weight per box approximation
                                    },
                                    packedDimensions: {
                                        width: actualWidth,
                                        height: variant.height,
                                        length: actualLength
                                    },
                                    remainingDimensions: {
                                        remainingWidth: (containerData.width - ((row + 1) * actualWidth)).toFixed(2),
                                        remainingHeight: (containerData.height - (y + variant.height)).toFixed(2),
                                        remainingLength: (containerData.length - ((col + 1) * actualLength)).toFixed(2)
                                    },
                                    color: "0x191970", // Navy blue for single variant
                                    type: variant.type || "cutsize",
                                    productLayer: variant.layer,
                                    pallet: true
                                });
                                
                                layerPalletCount++;
                                palletCount++;
                            }
                        }
                        currentZ += variant.height;
                    }
                }
            }
            
            return coordinates;
        }
        
        calculateOptimalFloorLayout(variant, containerData) {
            const orientations = [
                { l: variant.length, w: variant.width, name: 'original' },
                { l: variant.width, w: variant.length, name: 'rotated' }
            ];
            
            let bestLayout = null;
            let maxPalletsPerLayer = 0;
            
            orientations.forEach(orientation => {
                const palletsPerRowLength = Math.floor(containerData.length / orientation.l);
                const palletsPerRowWidth = Math.floor(containerData.width / orientation.w);
                const palletsPerLayer = palletsPerRowLength * palletsPerRowWidth;
                
                if (palletsPerLayer > maxPalletsPerLayer) {
                    maxPalletsPerLayer = palletsPerLayer;
                    bestLayout = {
                        palletsPerLayer,
                        orientation: `${orientation.l}x${orientation.w}`,
                        orientationName: orientation.name,
                        actualLength: orientation.l,
                        actualWidth: orientation.w,
                        palletsPerRowLength,
                        palletsPerRowWidth
                    };
                }
            });
            
            return bestLayout;
        }
    }
    
    /**
     * Main entry point
     */
    function greedyCalcCutsize(inputData) {
        try {
            const calculator = new ContainerLoadingCalculator();
            const result = calculator.calculateOptimalLoading(inputData);
            
            log.debug('Sequential Container Loading Result', result);
            
            saveFile(result)
            
            return result;
            
        } catch (error) {
            log.error('Sequential Container Loading Error', error);
            return {
                error: error.message,
                stack: error.stack
            };
        }
    }
    
    function saveFile(result){
        // Save data into file cabinet
        var fileObj3D = file.create({
            name: '3D_input_ftn_pnd.json',
            fileType: file.Type.JSON,
            contents: JSON.stringify(result),
            folder: 12262
        });
        fileId3D = fileObj3D.save();
        //
        // var fileObjConcal = file.create({
        //     name: 'ConCal_input_ftn.json',
        //     fileType: file.Type.JSON,
        //     contents:  JSON.stringify(jsonResultConcal),
        //     folder: 17979
        // });
        // var fileIdConcal = fileObjConcal.save();
        log.debug('File Saved', 'File ID 3D Input: ' + fileId3D);
        // log.debug('File Saved', 'File ID Concal Input: ' + fileIdConcal);
    }
    return {
        greedyCalcCutsize
    };
});