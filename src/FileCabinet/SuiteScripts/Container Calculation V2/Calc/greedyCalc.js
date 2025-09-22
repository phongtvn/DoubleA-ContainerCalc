/**
 * @NApiVersion 2.1
 */
define(['N/file'], function (file) {
    
    /**
     * Container Loading Calculator - OPTIMIZED FOR CLOSEST TO TARGET
     * Key changes: Prioritize closest to target weight over maximum capacity
     * Enhanced partial mixed loading for optimal combinations
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
                
                // Get target weight from the product group (in tons) - STORE ORIGINAL
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
                
                // Use sequential filling directly on all variants
                const solution = this.trySequentialContainers(
                    targetWeightKg,
                    variants,
                    containerData,
                    tolerance
                );
                
                if (solution.feasible) {
                    return this.generateSequentialOutput(solution, containerData, variants, action, tolerance, targetWeightTons);
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
            
            // Calculate enhanced mixed loading capacity once for reuse
            const mixedCapacity = this.calculateEnhancedMixedLoading(containerData, variants);
            
            // Sequential filling loop - continue until truly cannot fill more efficiently
            while (remainingWeight > 0) {
                const containerResult = this.fillSingleContainerOptimal(
                    remainingWeight,
                    variants,
                    variantCapacities,
                    mixedCapacity,
                    containerIndex
                );
                log.debug('containerResult', containerResult)

                if (containerResult.feasible && containerResult.container.totalNetWeight > 0) {
                    containers.push(containerResult.container);
                    remainingWeight -= containerResult.container.totalNetWeight;
                    containerIndex++;
                    
                    
                    const maxSingleContainerWeight = Math.max(
                        ...Object.keys(variants).map(key => {
                            const capacity = variantCapacities[key];
                            return capacity ? capacity.maxPallets * variants[key].netWeight : 0;
                        }),
                        mixedCapacity && mixedCapacity.bestCombination ? mixedCapacity.bestCombination.totalNetWeight : 0
                    );

                    log.debug('maxSingleContainerWeight', maxSingleContainerWeight)
                    log.debug('remainingWeight', remainingWeight)
                    if (remainingWeight < maxSingleContainerWeight * toleranceDecimal) {
                        break;
                    }
                    
                    // // Smart stopping logic: Consider both tolerance and efficiency
                    // const shortfallPercent = remainingWeight / targetWeightKg;
                    //
                    // // Stop if shortfall is within tolerance (business acceptable)
                    // if (shortfallPercent <= toleranceDecimal) {
                    //     break;
                    // }
                    //
                    // // Stop if remaining weight is truly negligible (< 1% of total target)
                    // if (remainingWeight <= targetWeightKg * 0.01) {
                    //     break;
                    // }
                    
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
         * Fill a single container optimally for given target weight - OPTIMIZED FOR CLOSEST TO TARGET
         */
        fillSingleContainerOptimal(targetWeight, variants, variantCapacities, mixedCapacity, containerIndex) {
            let bestSolution = null;
            let minDeviation = Infinity;
            
            // Strategy 1: Try enhanced mixed loading first (now optimized for closest to target)
            if (mixedCapacity && mixedCapacity.allCombinations) {
                mixedCapacity.allCombinations.forEach(combination => {
                    const deviation = Math.abs(combination.totalNetWeight - targetWeight);
                    const utilizationRatio = combination.totalNetWeight / targetWeight;
                    
                    // Only consider reasonable utilization ratios
                    if (utilizationRatio >= 0.05 && utilizationRatio <= 5.0) {
                        // NEW SCORING: Prioritize closest to target
                        const targetBonus = Math.max(0, 1000 - deviation); // Bonus for being close to target
                        const adjustedDeviation = deviation - targetBonus;
                        
                        if (adjustedDeviation < minDeviation) {
                            bestSolution = {
                                containerIndex: containerIndex,
                                type: 'enhanced_mixed',
                                ...combination,
                                deviation: deviation,
                                adjustedDeviation: adjustedDeviation,
                                utilizationRatio: utilizationRatio
                            };
                            minDeviation = adjustedDeviation;
                        }
                    }
                });
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
                    maxPallets // Include maximum capacity option but don't prioritize it
                ].filter(p => p > 0 && p <= maxPallets);
                
                // Remove duplicates
                const uniquePalletOptions = [...new Set(palletOptions)];
                
                uniquePalletOptions.forEach(pallets => {
                    const actualWeight = pallets * variant.netWeight;
                    const deviation = Math.abs(actualWeight - targetWeight);
                    const utilizationRatio = actualWeight / targetWeight;
                    
                    // NEW SCORING: Prioritize closest to target over capacity
                    const targetBonus = Math.max(0, 1000 - deviation);
                    const adjustedDeviation = deviation - targetBonus;
                    
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
            
            return {
                feasible: bestSolution !== null,
                container: bestSolution
            };
        }
        
        /**
         * ENHANCED mixed loading calculation - generates ALL feasible combinations for optimal target matching
         */
        calculateEnhancedMixedLoading(containerData, variants) {
            if (!containerData || Object.keys(variants).length < 2) return null;
            
            const variantKeys = Object.keys(variants);
            const allCombinations = [];
            
            // Get optimal floor layout with rotation support
            const bestFloorLayout = this.calculateOptimalFloorLayout(variants[variantKeys[0]], containerData);
            if (!bestFloorLayout) return null;
            
            // Generate ALL possible combinations of layers for each variant pair
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
                    
                    // Calculate max layers for each variant
                    const maxHeavyLayers = Math.floor(containerData.height / heavierVariant.height);
                    const maxLightLayers = Math.floor(containerData.height / lighterVariant.height);
                    
                    // Try ALL combinations, including partial layers
                    for (let heavyLayers = 0; heavyLayers <= maxHeavyLayers; heavyLayers++) {
                        for (let lightLayers = 0; lightLayers <= maxLightLayers; lightLayers++) {
                            if (heavyLayers === 0 && lightLayers === 0) continue;
                            
                            const totalHeight = (heavyLayers * heavierVariant.height) + (lightLayers * lighterVariant.height);
                            if (totalHeight > containerData.height) continue;
                            
                            // Try different pallet counts for partial layers
                            const heavyPalletOptions = heavyLayers > 0 ? this.generatePalletOptions(bestFloorLayout.palletsPerLayer) : [0];
                            const lightPalletOptions = lightLayers > 0 ? this.generatePalletOptions(bestFloorLayout.palletsPerLayer) : [0];
                            
                            heavyPalletOptions.forEach(heavyPalletsPerLayer => {
                                lightPalletOptions.forEach(lightPalletsPerLayer => {
                                    if (heavyPalletsPerLayer === 0 && lightPalletsPerLayer === 0) return;
                                    
                                    const totalHeavyPallets = heavyLayers * heavyPalletsPerLayer;
                                    const totalLightPallets = lightLayers * lightPalletsPerLayer;
                                    const totalPallets = totalHeavyPallets + totalLightPallets;
                                    
                                    const totalNetWeight = (totalHeavyPallets * heavierVariant.netWeight) +
                                        (totalLightPallets * lighterVariant.netWeight);
                                    const totalGrossWeight = (totalHeavyPallets * heavierVariant.grossWeight) +
                                        (totalLightPallets * lighterVariant.grossWeight);
                                    
                                    // Check weight constraint
                                    if (totalGrossWeight / 1000 > containerData.maxWeight) return;
                                    
                                    // Add to combinations if meaningful
                                    if (totalNetWeight > 0) {
                                        const layers = [];
                                        
                                        if (totalHeavyPallets > 0) {
                                            layers.push({
                                                variant: heavierKey,
                                                layerCount: heavyLayers,
                                                palletsPerLayer: heavyPalletsPerLayer,
                                                totalPallets: totalHeavyPallets,
                                                netWeight: totalHeavyPallets * heavierVariant.netWeight,
                                                grossWeight: totalHeavyPallets * heavierVariant.grossWeight,
                                                height: heavierVariant.height,
                                                position: 'bottom'
                                            });
                                        }
                                        
                                        if (totalLightPallets > 0) {
                                            layers.push({
                                                variant: lighterKey,
                                                layerCount: lightLayers,
                                                palletsPerLayer: lightPalletsPerLayer,
                                                totalPallets: totalLightPallets,
                                                netWeight: totalLightPallets * lighterVariant.netWeight,
                                                grossWeight: totalLightPallets * lighterVariant.grossWeight,
                                                height: lighterVariant.height,
                                                position: 'top'
                                            });
                                        }
                                        
                                        allCombinations.push({
                                            type: 'enhanced_mixed',
                                            totalPallets: totalPallets,
                                            totalNetWeight: Math.round(totalNetWeight),
                                            totalGrossWeight: totalGrossWeight,
                                            totalHeight: totalHeight,
                                            layers: layers,
                                            floorLayout: bestFloorLayout,
                                            combinationId: `${heavierKey}:${totalHeavyPallets}-${lighterKey}:${totalLightPallets}`
                                        });
                                    }
                                });
                            });
                        }
                    }
                }
            }
            
            // Sort by closest to reasonable target weight ranges instead of maximum weight
            allCombinations.sort((a, b) => {
                // Prefer combinations that are likely to be close to common targets
                const aScore = this.calculateCombinationScore(a.totalNetWeight);
                const bScore = this.calculateCombinationScore(b.totalNetWeight);
                return bScore - aScore;
            });
            
            return {
                type: 'enhanced_mixed',
                allCombinations: allCombinations,
                bestCombination: allCombinations.length > 0 ? allCombinations[0] : null
            };
        }
        
        /**
         * Generate pallet options for partial layers
         */
        generatePalletOptions(maxPalletsPerLayer) {
            const options = [maxPalletsPerLayer]; // Full layer
            
            // Add partial layer options (useful for optimization)
            for (let pallets = maxPalletsPerLayer - 1; pallets >= 1; pallets--) {
                options.push(pallets);
            }
            
            return options;
        }
        
        /**
         * Calculate combination score for sorting (prefer reasonable weights over maximum)
         */
        calculateCombinationScore(weight) {
            const weightTons = weight / 1000;
            
            // Prefer weights that are commonly targeted (10-20 tons range)
            if (weightTons >= 10 && weightTons <= 20) {
                return 1000 + weight; // High priority for realistic targets
            } else if (weightTons >= 5 && weightTons <= 25) {
                return 500 + weight; // Medium priority
            } else {
                return weight; // Low priority for extreme weights
            }
        }
        
        /**
         * Calculate optimal floor layout with rotation support
         */
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
         * Generate output for sequential container solution - FIXED VERSION
         */
        generateSequentialOutput(results, containerData, variants, action, tolerance, originalTargetWeightTons) {
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
                recommendedItems: this.generateSequentialRecommendations(solution, variants, containerData, tolerance, originalTargetWeightTons)
            };
        }
        
        /**
         * Generate output for individual container
         */
        generateSingleContainerOutput(container, containerData, variants, action) {
            if (container.type === 'enhanced_mixed' || container.type === 'mixed' || container.type === 'partial_mixed') {
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
         * Generate recommendations for sequential solution - FIXED VERSION
         */
        generateSequentialRecommendations(solution, variants, containerData, tolerance, originalTargetWeightTons) {
            const recommendations = {};
            
            // Calculate enhanced mixed loading capacity for full containers
            const mixedCapacity = this.calculateEnhancedMixedLoading(containerData, variants);
            let maxCapacityPerContainer = 0;
            
            // If mixed loading available, use best combination. Otherwise use single variant max capacity
            if (mixedCapacity && mixedCapacity.bestCombination) {
                maxCapacityPerContainer = mixedCapacity.bestCombination.totalNetWeight;
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
            
            // FIX: Use original target weight passed from main function
            const originalOrderedWeightTons = originalTargetWeightTons;
            
            // If we have partial containers, offer clear business choices
            if (currentContainers > 0 && maxCapacityPerContainer > 0) {
                
                // OPTION 1: Increase to fill all containers optimally (full utilization)
                const fullContainersWeight = currentContainers * maxCapacityPerContainer / 1000; // tons
                log.debug('fullContainersWeight', fullContainersWeight)
                log.debug('originalOrderedWeightTons', originalOrderedWeightTons)
                
                // FIX: Calculate increase needed based on original order weight
                const increaseNeeded = fullContainersWeight - originalOrderedWeightTons;
                
                
                if (Math.abs(increaseNeeded)  >= 0.001) {
                    recommendations.option1 = []
                    recommendations.option1.push({
                        type: 'dedicated',//mixedCapacity ? "optimize_full_containers" : "optimize_single_variant_containers",
                        action: increaseNeeded > 0 ? "increase" : "decrease",
                        internalId: firstVariant.internalId,
                        parentID: firstVariant.parentID || firstVariant.internalId,
                        displayName: firstVariant.parentName,// || firstVariant.displayName.split(" AUTO")[0],
                        suggestedQty: increaseNeeded.toFixed(3),
                        uom: "MT",
                        currentOrder: originalOrderedWeightTons.toFixed(3), // Show original order
                        targetWeight: fullContainersWeight.toFixed(3),
                        containers: currentContainers,
                        //utilizationStatus: "OPTIMAL_TARGET_MATCH",
                        loadingType: mixedCapacity ? "enhanced_mixed" : "single_variant"
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
                        currentOrder: originalOrderedWeightTons.toFixed(3),
                        note: `Thêm ${remainingTons.toFixed(3)} tấn để hoàn thành đơn hàng`
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
        
        /**
         * Generate 3D coordinates for visualization
         */
        generate3DCoordinates(container, containerData, variants) {
            const coordinates = [];
            
            if (container.type === 'enhanced_mixed' || container.type === 'mixed' || container.type === 'partial_mixed') {
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
                            let palletCount = 0;
                            
                            // For partial layers, only place the specified number of pallets
                            const palletsInThisLayer = layer.palletsPerLayer;
                            
                            for (let row = 0; row < floorLayout.palletsPerRowWidth && palletCount < palletsInThisLayer; row++) {
                                for (let col = 0; col < floorLayout.palletsPerRowLength && palletCount < palletsInThisLayer; col++) {
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
                                    
                                    palletCount++;
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
        log.debug('File Saved', 'File ID 3D Input: ' + fileId3D);
    }
    return {
        greedyCalcCutsize
    };
});