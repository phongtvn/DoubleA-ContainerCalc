/**
 * @NApiVersion 2.1
 */
define(['N/file'], function (file) {
    
    /**
     * Container Loading Calculator with Mixed Loading Support
     * Calculates optimal container loading for paper products including mixed variant stacking
     */
    class ContainerLoadingCalculator {
        
        constructor() {
            // Constructor intentionally empty since container data now comes from input
        }
        
        /**
         * Find optimal container loading strategy including mixed loading
         */
        calculateOptimalLoading(input) {
            // Extract container data and items from the new input format
            const {boxesCutsize, containerData, tolerance, action} = input;
            
            // Get the first product group to extract items
            const productGroups = Object.keys(boxesCutsize);
            if (productGroups.length === 0) {
                return { error: "No products found in boxesCutsize" };
            }
            
            // Extract data from first product group with new format
            const firstProductKey = productGroups[0];
            const firstProduct = boxesCutsize[firstProductKey];
            
            if (!firstProduct || !firstProduct.variants || firstProduct.variants.length === 0) {
                return { error: "No variants found in the product group" };
            }
            
            // Get target weight from the product group (in tons)
            const targetWeightTons = firstProduct.weight || 0;
            const targetWeightKg = targetWeightTons * 1000; // Convert to kg
            
            // Use container data from top level
            if (!containerData) {
                return { error: "Container data not found in input" };
            }
            
            // Get all variants from the product group with unique keys and group by pallet type
            const variantsByPalletType = {};
            const allVariants = {};
            
            firstProduct.variants.forEach(item => {
                // Use internalId as unique key instead of layer
                const uniqueKey = item.internalId;
                allVariants[uniqueKey] = {
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
                
                // Group by pallet type (constraint: 1 container = 1 pallet type)
                if (!variantsByPalletType[item.palletType]) {
                    variantsByPalletType[item.palletType] = {};
                }
                variantsByPalletType[item.palletType][uniqueKey] = allVariants[uniqueKey];
            });
            
            log.debug('variantsByPalletType', variantsByPalletType);
            
            // Find best solution across all pallet types
            let bestSolution = null;
            let bestPalletType = null;
            let bestVariants = null;
            
            Object.keys(variantsByPalletType).forEach(palletType => {
                const variants = variantsByPalletType[palletType];
                
                // Calculate max capacity for each variant in this pallet type
                const variantCapacities = {};
                Object.keys(variants).forEach(variantKey => {
                    const capacity = this.calculateMaxPalletsPerContainer(containerData, variants[variantKey]);
                    variantCapacities[variantKey] = capacity;
                });
                
                // Calculate mixed loading capacity within same pallet type
                const mixedCapacity = this.calculateMixedLoading(containerData, variants);
                
                // Try single container first (including mixed loading)
                const singleContainerResults = this.trySingleContainer(targetWeightKg, variants, variantCapacities, mixedCapacity, tolerance);
                
                if (singleContainerResults.feasible) {
                    if (!bestSolution || singleContainerResults.solution.excess < bestSolution.excess) {
                        bestSolution = singleContainerResults;
                        bestPalletType = palletType;
                        bestVariants = variants;
                    }
                }
                
                // Try dual container strategy within same pallet type
                const dualContainerResults = this.tryDualContainer(targetWeightKg, variants, variantCapacities, mixedCapacity);
                
                if (dualContainerResults.feasible) {
                    if (!bestSolution || dualContainerResults.solution.excess < bestSolution.excess) {
                        bestSolution = dualContainerResults;
                        bestPalletType = palletType;
                        bestVariants = variants;
                    }
                }
            });
            
            log.debug('bestSolution', bestSolution);
            log.debug('bestPalletType', bestPalletType);
            
            if (bestSolution) {
                if (bestSolution.solution.type.startsWith('dual')) {
                    return this.generateDualContainerOutput(bestSolution, containerData, bestVariants, action, tolerance);
                } else {
                    return this.generateSingleContainerOutput(bestSolution, containerData, bestVariants, action, tolerance);
                }
            }
            
            // Return error if no solution found across all pallet types
            return {
                error: "No feasible solution found for any pallet type",
                suggestions: this.generateAlternativeSuggestions(targetWeightKg, allVariants, {}, containerData),
                palletTypeAnalysis: Object.keys(variantsByPalletType).map(palletType => ({
                    palletType: palletType,
                    variantCount: Object.keys(variantsByPalletType[palletType]).length,
                    variants: Object.keys(variantsByPalletType[palletType]).map(key => ({
                        internalId: variantsByPalletType[palletType][key].internalId,
                        layer: variantsByPalletType[palletType][key].layer,
                        displayName: variantsByPalletType[palletType][key].displayName
                    }))
                }))
            };
        }
        
        /**
         * Parse tolerance percentage string to decimal
         */
        parseTolerancePercent(toleranceStr) {
            if (!toleranceStr) return 0.1; // Default 10%
            
            // Remove % sign and convert to decimal
            const numStr = toleranceStr.toString().replace('%', '');
            const percent = parseFloat(numStr);
            
            return isNaN(percent) ? 0.1 : percent / 100;
        }
        
        /**
         * Calculate maximum pallets per container for a single variant
         */
        calculateMaxPalletsPerContainer(containerData, variant) {
            if (!containerData) return null;
            
            // Try both orientations: length x width and width x length
            const orientations = [
                { l: variant.length, w: variant.width },
                { l: variant.width, w: variant.length }
            ];
            
            let maxPallets = 0;
            let bestConfig = null;
            
            orientations.forEach(orientation => {
                const palletsPerRowLength = Math.floor(containerData.length / orientation.l);
                const palletsPerRowWidth = Math.floor(containerData.width / orientation.w);
                const palletsPerLayer = palletsPerRowLength * palletsPerRowWidth;
                const maxLayers = Math.floor(containerData.height / variant.height);
                const totalPallets = palletsPerLayer * maxLayers;
                
                // Check weight constraint
                const totalGrossWeight = totalPallets * variant.grossWeight / 1000; // tons
                
                if (totalGrossWeight <= containerData.maxWeight && totalPallets > maxPallets) {
                    maxPallets = totalPallets;
                    bestConfig = {
                        palletsPerLayer: palletsPerLayer,
                        maxLayers: maxLayers,
                        orientation: `${orientation.l}x${orientation.w}`
                    };
                }
            });
            
            return {
                maxPallets: maxPallets,
                config: bestConfig
            };
        }
        
        /**
         * Calculate mixed loading strategies
         */
        calculateMixedLoading(containerData, variants) {
            if (!containerData || Object.keys(variants).length < 2) return null;
            
            const variantKeys = Object.keys(variants);
            const mixedStrategies = [];
            
            // Get optimal floor layout (same for all variants with same footprint)
            const firstVariant = variants[variantKeys[0]];
            const orientations = [
                { l: firstVariant.length, w: firstVariant.width },
                { l: firstVariant.width, w: firstVariant.length }
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
                        orientation: `${orientation.l}x${orientation.w}`
                    };
                }
            });
            
            if (!bestFloorLayout) return null;
            
            // Generate all possible layer combinations
            const maxLayersPerVariant = {};
            variantKeys.forEach(key => {
                maxLayersPerVariant[key] = Math.floor(containerData.height / variants[key].height);
            });
            
            // Test different combinations of layers - PRIORITIZE OPTIMAL STACKING
            for (let i = 0; i < variantKeys.length; i++) {
                for (let j = i; j < variantKeys.length; j++) {
                    const variant1Key = variantKeys[i];
                    const variant2Key = variantKeys[j];
                    const variant1 = variants[variant1Key];
                    const variant2 = variants[variant2Key];
                    
                    // Skip if same variant (handled by single variant logic)
                    if (i === j) continue;
                    
                    // Sort variants by weight (heavier should go to bottom)
                    const heavierVariant = variant1.grossWeight > variant2.grossWeight ? variant1 : variant2;
                    const lighterVariant = variant1.grossWeight > variant2.grossWeight ? variant2 : variant1;
                    const heavierKey = variant1.grossWeight > variant2.grossWeight ? variant1Key : variant2Key;
                    const lighterKey = variant1.grossWeight > variant2.grossWeight ? variant2Key : variant1Key;
                    
                    // Try different layer distributions (heavier variant at bottom)
                    for (let heavyLayers = 1; heavyLayers <= maxLayersPerVariant[heavierKey]; heavyLayers++) {
                        for (let lightLayers = 1; lightLayers <= maxLayersPerVariant[lighterKey]; lightLayers++) {
                            const totalHeight = (heavyLayers * heavierVariant.height) + (lightLayers * lighterVariant.height);
                            
                            if (totalHeight <= containerData.height) {
                                const totalPallets = (heavyLayers + lightLayers) * bestFloorLayout.palletsPerLayer;
                                const totalNetWeight = (heavyLayers * bestFloorLayout.palletsPerLayer * heavierVariant.netWeight) +
                                    (lightLayers * bestFloorLayout.palletsPerLayer * lighterVariant.netWeight);
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
                                                position: 'bottom' // Heavy pallets at bottom
                                            },
                                            {
                                                variant: lighterKey,
                                                layerCount: lightLayers,
                                                palletsPerLayer: bestFloorLayout.palletsPerLayer,
                                                totalPallets: lightLayers * bestFloorLayout.palletsPerLayer,
                                                netWeight: lightLayers * bestFloorLayout.palletsPerLayer * lighterVariant.netWeight,
                                                grossWeight: lightLayers * bestFloorLayout.palletsPerLayer * lighterVariant.grossWeight,
                                                height: lighterVariant.height,
                                                position: 'top' // Light pallets on top
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
         * Calculate required pallets for target weight
         */
        calculateRequiredPallets(targetWeightKg, variant) {
            return Math.ceil(targetWeightKg / variant.netWeight);
        }
        
        /**
         * Try single container solutions including mixed loading
         */
        trySingleContainer(targetWeightKg, variants, variantCapacities, mixedCapacity, tolerance) {
            let bestSolution = null;
            let minExcess = Infinity;
            
            // Parse tolerance percentage
            const toleranceDecimal = this.parseTolerancePercent(tolerance);
            
            // PRIORITY 1: Test mixed loading solution first (better utilization)
            if (mixedCapacity) {
                // Check if mixed loading can handle the target weight (allowing shortfall within tolerance)
                const mixedDeficit = targetWeightKg - mixedCapacity.totalNetWeight;
                const mixedExcess = mixedCapacity.totalNetWeight - targetWeightKg;
                const deficitPercentage = Math.abs(mixedDeficit) / targetWeightKg;
                
                // Accept mixed loading if:
                // 1. It meets or exceeds target, OR
                // 2. Shortfall is within tolerance percentage
                if (mixedExcess >= 0 || deficitPercentage <= toleranceDecimal) {
                    bestSolution = {
                        type: 'mixed',
                        ...mixedCapacity,
                        excess: Math.max(0, mixedExcess), // Don't show negative excess
                        shortfall: Math.max(0, mixedDeficit), // Track shortfall if any
                        withinTolerance: deficitPercentage <= toleranceDecimal
                    };
                    minExcess = Math.max(0, mixedExcess);
                    
                    // If mixed loading is within tolerance, prefer it over single variants
                    if (deficitPercentage <= toleranceDecimal * 0.5) { // Within half tolerance
                        return {
                            feasible: true,
                            solution: bestSolution
                        };
                    }
                }
            }
            
            // PRIORITY 2: Test single variant solutions only if mixed loading doesn't work well
            Object.keys(variants).forEach(layer => {
                const variant = variants[layer];
                const capacity = variantCapacities[layer];
                
                if (!capacity || capacity.maxPallets === 0) return;
                
                const requiredPallets = this.calculateRequiredPallets(targetWeightKg, variant);
                
                if (requiredPallets <= capacity.maxPallets) {
                    const actualWeight = requiredPallets * variant.netWeight;
                    const excess = actualWeight - targetWeightKg;
                    
                    // Only consider single variant if it's significantly better than mixed loading
                    if (excess >= 0 && excess < minExcess && (!bestSolution || excess < bestSolution.excess * 0.8)) {
                        minExcess = excess;
                        bestSolution = {
                            type: 'single',
                            variant: layer,
                            pallets: requiredPallets,
                            netWeight: actualWeight,
                            grossWeight: requiredPallets * variant.grossWeight,
                            excess: excess
                        };
                    }
                }
            });
            
            return {
                feasible: bestSolution !== null,
                solution: bestSolution
            };
        }
        
        /**
         * Try dual container solutions
         */
        tryDualContainer(targetWeightKg, variants, variantCapacities, mixedCapacity) {
            let bestSolution = null;
            let minExcess = Infinity;
            
            // PRIORITY 1: Try mixed loading in first container (best utilization)
            if (mixedCapacity) {
                const remainingWeight = targetWeightKg - mixedCapacity.totalNetWeight;
                
                if (remainingWeight > 0) {
                    // Try to fill remaining with second container
                    Object.keys(variants).forEach(secondLayer => {
                        const secondVariant = variants[secondLayer];
                        const secondCapacity = variantCapacities[secondLayer];
                        
                        if (!secondCapacity || secondCapacity.maxPallets === 0) return;
                        
                        const requiredSecondPallets = Math.ceil(remainingWeight / secondVariant.netWeight);
                        
                        if (requiredSecondPallets <= secondCapacity.maxPallets) {
                            const actualSecondWeight = requiredSecondPallets * secondVariant.netWeight;
                            const totalWeight = mixedCapacity.totalNetWeight + actualSecondWeight;
                            const excess = totalWeight - targetWeightKg;
                            
                            if (excess >= 0 && excess < minExcess) {
                                minExcess = excess;
                                bestSolution = {
                                    type: 'dual-mixed',
                                    container1: {
                                        type: 'mixed',
                                        ...mixedCapacity,
                                        status: "MIXED_OPTIMIZED"
                                    },
                                    container2: {
                                        type: 'single',
                                        variant: secondLayer,
                                        pallets: requiredSecondPallets,
                                        netWeight: actualSecondWeight,
                                        grossWeight: requiredSecondPallets * secondVariant.grossWeight,
                                        status: "PARTIAL"
                                    },
                                    totalWeight: totalWeight,
                                    excess: excess
                                };
                            }
                        }
                    });
                }
            }
            
            // PRIORITY 2: Traditional dual container strategy (only if mixed loading doesn't work well)
            if (!bestSolution || minExcess > targetWeightKg * 0.1) {
                Object.keys(variants).forEach(firstLayer => {
                    const firstVariant = variants[firstLayer];
                    const firstCapacity = variantCapacities[firstLayer];
                    
                    if (!firstCapacity || firstCapacity.maxPallets === 0) return;
                    
                    // Fill first container completely
                    const firstContainerPallets = firstCapacity.maxPallets;
                    const firstContainerWeight = firstContainerPallets * firstVariant.netWeight;
                    const remainingWeight = targetWeightKg - firstContainerWeight;
                    
                    if (remainingWeight <= 0) return;
                    
                    // Try different variants for second container
                    Object.keys(variants).forEach(secondLayer => {
                        const secondVariant = variants[secondLayer];
                        const secondCapacity = variantCapacities[secondLayer];
                        
                        if (!secondCapacity || secondCapacity.maxPallets === 0) return;
                        
                        const requiredSecondPallets = Math.ceil(remainingWeight / secondVariant.netWeight);
                        
                        if (requiredSecondPallets <= secondCapacity.maxPallets) {
                            const actualSecondWeight = requiredSecondPallets * secondVariant.netWeight;
                            const totalWeight = firstContainerWeight + actualSecondWeight;
                            const excess = totalWeight - targetWeightKg;
                            
                            if (excess >= 0 && excess < minExcess) {
                                minExcess = excess;
                                bestSolution = {
                                    type: 'dual-single',
                                    container1: {
                                        type: 'single',
                                        variant: firstLayer,
                                        pallets: firstContainerPallets,
                                        netWeight: firstContainerWeight,
                                        grossWeight: firstContainerPallets * firstVariant.grossWeight,
                                        status: "FULL"
                                    },
                                    container2: {
                                        type: 'single',
                                        variant: secondLayer,
                                        pallets: requiredSecondPallets,
                                        netWeight: actualSecondWeight,
                                        grossWeight: requiredSecondPallets * secondVariant.grossWeight,
                                        status: "PARTIAL"
                                    },
                                    totalWeight: totalWeight,
                                    excess: excess
                                };
                            }
                        }
                    });
                });
            }
            
            return {
                feasible: bestSolution !== null,
                solution: bestSolution
            };
        }
        
        /**
         * Generate single container output with 3D coordinates
         */
        generateSingleContainerOutput(results, containerData, variants, action, tolerance) {
            const solution = results.solution;
            
            if (solution.type === 'mixed') {
                return this.generateMixedContainerOutput(solution, containerData, variants, action, tolerance);
            }
            
            // Handle single variant container
            const variant = variants[solution.variant];
            const capacity = this.calculateMaxPalletsPerContainer(containerData, variant);
            
            const reams = Math.floor(solution.netWeight / variant.uomConversionRates.ream);
            const cartons = Math.floor(solution.netWeight / variant.uomConversionRates.carton);
            
            const containerOutput = {
                containerIndex: 1,
                containerSize: containerData,
                totalReamsCopyPaper: `${reams} RM`,
                totalBoxesCopyPaper: `${cartons} CAR`,
                totalPalletsCopyPaper: `${solution.pallets} PAL`,
                item: [
                    {
                        product: variant.product,
                        internalId: variant.internalId,
                        displayName: variant.displayName,
                        type: variant.type,
                        layer: capacity.config.maxLayers,
                        netWeight: (solution.netWeight / 1000).toFixed(3),
                        netWeightKG: solution.netWeight.toFixed(3),
                        grossWeight: (solution.grossWeight / 1000).toFixed(3),
                        grossWeightKG: solution.grossWeight.toFixed(3),
                        reams: `${reams} RM`,
                        boxes: `${cartons} CAR`,
                        palletsPerContainer: `${solution.pallets} PAL`,
                        palletsPerLayer: `${capacity.config.palletsPerLayer} PAL`,
                        productLayer: variant.layer,
                        price: 0
                    }
                ]
            };
            
            // Only generate 3D coordinates when action is "view3D"
            if (action === 'view3D') {
                containerOutput.coordinates3D = this.generate3DCoordinates(solution, containerData, variants);
            }
            
            return {
                containers: [containerOutput],
                recommendedItems: this.generateRecommendations(solution, variant, containerData, tolerance)
            };
        }
        
        /**
         * Generate mixed container output with 3D coordinates
         */
        generateMixedContainerOutput(solution, containerData, variants, action, tolerance) {
            const totalReams = Math.floor(solution.totalNetWeight / variants[Object.keys(variants)[0]].uomConversionRates.ream);
            const totalCartons = Math.floor(solution.totalNetWeight / variants[Object.keys(variants)[0]].uomConversionRates.carton);
            
            const items = solution.layers.map((layer, index) => {
                const variant = variants[layer.variant];
                const reams = Math.floor(layer.netWeight / variant.uomConversionRates.ream);
                const cartons = Math.floor(layer.netWeight / variant.uomConversionRates.carton);
                
                return {
                    product: variant.product,
                    internalId: variant.internalId,
                    displayName: variant.displayName,
                    type: variant.type,
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
                containerIndex: 1,
                containerSize: containerData,
                totalReamsCopyPaper: `${totalReams} RM`,
                totalBoxesCopyPaper: `${totalCartons} CAR`,
                totalPalletsCopyPaper: `${solution.totalPallets} PAL`,
                item: items
            };
            
            // Only generate 3D coordinates when action is "view3D"
            if (action === 'view3D') {
                containerOutput.coordinates3D = this.generate3DCoordinates(solution, containerData, variants);
            }
            
            return {
                containers: [containerOutput],
                recommendedItems: this.generateMixedRecommendations(solution, variants, containerData, tolerance)
            };
        }
        
        /**
         * Generate dual container output with 3D coordinates
         */
        generateDualContainerOutput(results, containerData, variants, action, tolerance) {
            const solution = results.solution;
            const containers = [];
            
            // Container 1
            if (solution.container1.type === 'mixed') {
                const container1 = this.generateMixedContainerOutput(solution.container1, containerData, variants, action, tolerance).containers[0];
                container1.containerIndex = 1;
                containers.push(container1);
            } else {
                const variant1 = variants[solution.container1.variant];
                const capacity1 = this.calculateMaxPalletsPerContainer(containerData, variant1);
                const reams1 = Math.floor(solution.container1.netWeight / variant1.uomConversionRates.ream);
                const cartons1 = Math.floor(solution.container1.netWeight / variant1.uomConversionRates.carton);
                
                const container1Output = {
                    containerIndex: 1,
                    containerSize: containerData,
                    totalReamsCopyPaper: `${reams1} RM`,
                    totalBoxesCopyPaper: `${cartons1} CAR`,
                    totalPalletsCopyPaper: `${solution.container1.pallets} PAL`,
                    item: [
                        {
                            product: variant1.product,
                            internalId: variant1.internalId,
                            displayName: variant1.displayName,
                            type: variant1.type,
                            layer: capacity1.config.maxLayers,
                            netWeight: (solution.container1.netWeight / 1000).toFixed(3),
                            netWeightKG: solution.container1.netWeight.toFixed(3),
                            grossWeight: (solution.container1.grossWeight / 1000).toFixed(3),
                            grossWeightKG: solution.container1.grossWeight.toFixed(3),
                            reams: `${reams1} RM`,
                            boxes: `${cartons1} CAR`,
                            palletsPerContainer: `${solution.container1.pallets} PAL`,
                            palletsPerLayer: `${capacity1.config.palletsPerLayer} PAL`,
                            productLayer: variant1.layer,
                            price: 0
                        }
                    ]
                };
                
                // Only generate 3D coordinates when action is "view3D"
                if (action === 'view3D') {
                    container1Output.coordinates3D = this.generate3DCoordinates(solution.container1, containerData, variants);
                }
                
                containers.push(container1Output);
            }
            
            // Container 2
            const variant2 = variants[solution.container2.variant];
            const capacity2 = this.calculateMaxPalletsPerContainer(containerData, variant2);
            const reams2 = Math.floor(solution.container2.netWeight / variant2.uomConversionRates.ream);
            const cartons2 = Math.floor(solution.container2.netWeight / variant2.uomConversionRates.carton);
            
            // Calculate actual pallets per layer for container 2 (might be partial)
            const actualLayersContainer2 = Math.ceil(solution.container2.pallets / capacity2.config.palletsPerLayer);
            const palletsInLastLayer = solution.container2.pallets % capacity2.config.palletsPerLayer || capacity2.config.palletsPerLayer;
            const displayPalletsPerLayer = actualLayersContainer2 === 1 ? solution.container2.pallets : palletsInLastLayer;
            
            const container2Output = {
                containerIndex: 2,
                containerSize: containerData,
                totalReamsCopyPaper: `${reams2} RM`,
                totalBoxesCopyPaper: `${cartons2} CAR`,
                totalPalletsCopyPaper: `${solution.container2.pallets} PAL`,
                item: [
                    {
                        product: variant2.product,
                        internalId: variant2.internalId,
                        displayName: variant2.displayName,
                        type: variant2.type,
                        layer: actualLayersContainer2,
                        netWeight: (solution.container2.netWeight / 1000).toFixed(3),
                        netWeightKG: solution.container2.netWeight.toFixed(3),
                        grossWeight: (solution.container2.grossWeight / 1000).toFixed(3),
                        grossWeightKG: solution.container2.grossWeight.toFixed(3),
                        reams: `${reams2} RM`,
                        boxes: `${cartons2} CAR`,
                        palletsPerContainer: `${solution.container2.pallets} PAL`,
                        palletsPerLayer: `${displayPalletsPerLayer} PAL`,
                        productLayer: variant2.layer,
                        price: 0
                    }
                ]
            };
            
            // Only generate 3D coordinates when action is "view3D"
            if (action === 'view3D') {
                container2Output.coordinates3D = this.generate3DCoordinates(solution.container2, containerData, variants);
            }
            
            containers.push(container2Output);
            
            return {
                containers: containers,
                recommendedItems: this.generateDualContainerRecommendations(solution, variants, containerData, tolerance)
            };
        }
        
        /**
         * Generate recommendations for optimization
         */
        generateRecommendations(solution, variant, containerData, tolerance) {
            // Calculate max possible with full container utilization
            const maxCapacity = this.calculateMaxPalletsPerContainer(containerData, variant);
            if (!maxCapacity || !maxCapacity.config) return { option1: [] };
            
            const maxWeight = maxCapacity.maxPallets * variant.netWeight / 1000;
            const currentWeight = solution.netWeight / 1000;
            const suggestedIncrease = maxWeight - currentWeight;
            
            // Parse tolerance percentage and use it as threshold
            const toleranceDecimal = this.parseTolerancePercent(tolerance);
            const toleranceThreshold = currentWeight * toleranceDecimal;
            
            if (suggestedIncrease > toleranceThreshold) {
                return {
                    option1: [
                        {
                            type: "dedicated",
                            action: "increase",
                            internalId: variant.internalId,
                            parentID: variant.parentID || variant.internalId,
                            displayName: variant.parentName || variant.displayName.split(" AUTO")[0],
                            suggestedQty: suggestedIncrease.toFixed(3),
                            uom: "ton"
                        }
                    ]
                };
            }
            
            return { option1: [] };
        }
        
        /**
         * Generate 3D coordinates for pallets with heavy pallets at bottom
         */
        generate3DCoordinates(solution, containerData, variants) {
            const coordinates = [];
            
            if (solution.type === 'mixed') {
                // Sort layers by weight (heaviest first = bottom)
                const sortedLayers = [...solution.layers].sort((a, b) => {
                    const variantA = variants[a.variant];
                    const variantB = variants[b.variant];
                    return variantB.grossWeight - variantA.grossWeight;
                });
                
                let currentZ = 0;
                let palletId = 1;
                
                sortedLayers.forEach((layer, layerIndex) => {
                    const variant = variants[layer.variant];
                    
                    // Calculate floor layout
                    const orientation = this.getBestOrientation(containerData, variant);
                    const palletsPerRowLength = Math.floor(containerData.length / orientation.l);
                    const palletsPerRowWidth = Math.floor(containerData.width / orientation.w);
                    
                    // Generate coordinates for each layer
                    for (let layerNum = 0; layerNum < layer.layerCount; layerNum++) {
                        for (let row = 0; row < palletsPerRowWidth; row++) {
                            for (let col = 0; col < palletsPerRowLength; col++) {
                                const x = col * orientation.l + (orientation.l / 2);
                                const y = row * orientation.w + (orientation.w / 2);
                                const z = currentZ + (variant.height / 2);
                                
                                coordinates.push({
                                    palletId: palletId++,
                                    variant: layer.variant,
                                    layer: layerIndex + 1,
                                    subLayer: layerNum + 1,
                                    position: {
                                        x: x,
                                        y: y,
                                        z: z
                                    },
                                    dimensions: {
                                        length: orientation.l,
                                        width: orientation.w,
                                        height: variant.height
                                    },
                                    rotation: orientation.l !== variant.length ? 90 : 0,
                                    weight: {
                                        net: variant.netWeight,
                                        gross: variant.grossWeight
                                    },
                                    product: {
                                        internalId: variant.internalId,
                                        displayName: variant.displayName,
                                        layer: variant.layer
                                    }
                                });
                            }
                        }
                        currentZ += variant.height;
                    }
                });
            } else {
                // Single variant loading
                const variant = variants[solution.variant];
                const capacity = this.calculateMaxPalletsPerContainer(containerData, variant);
                const orientation = this.getBestOrientation(containerData, variant);
                
                const palletsPerRowLength = Math.floor(containerData.length / orientation.l);
                const palletsPerRowWidth = Math.floor(containerData.width / orientation.w);
                const palletsPerLayer = palletsPerRowLength * palletsPerRowWidth;
                const totalLayers = Math.ceil(solution.pallets / palletsPerLayer);
                
                let palletId = 1;
                let currentZ = 0;
                
                for (let layer = 0; layer < totalLayers; layer++) {
                    const palletsInThisLayer = Math.min(palletsPerLayer, solution.pallets - (layer * palletsPerLayer));
                    
                    let palletCount = 0;
                    for (let row = 0; row < palletsPerRowWidth && palletCount < palletsInThisLayer; row++) {
                        for (let col = 0; col < palletsPerRowLength && palletCount < palletsInThisLayer; col++) {
                            const x = col * orientation.l + (orientation.l / 2);
                            const y = row * orientation.w + (orientation.w / 2);
                            const z = currentZ + (variant.height / 2);
                            
                            coordinates.push({
                                palletId: palletId++,
                                variant: solution.variant,
                                layer: layer + 1,
                                subLayer: 1,
                                position: {
                                    x: x,
                                    y: y,
                                    z: z
                                },
                                dimensions: {
                                    length: orientation.l,
                                    width: orientation.w,
                                    height: variant.height
                                },
                                rotation: orientation.l !== variant.length ? 90 : 0,
                                weight: {
                                    net: variant.netWeight,
                                    gross: variant.grossWeight
                                },
                                product: {
                                    internalId: variant.internalId,
                                    displayName: variant.displayName,
                                    layer: variant.layer
                                }
                            });
                            palletCount++;
                        }
                    }
                    currentZ += variant.height;
                }
            }
            
            return coordinates;
        }
        
        /**
         * Get best orientation for a variant
         */
        getBestOrientation(containerData, variant) {
            const orientations = [
                { l: variant.length, w: variant.width },
                { l: variant.width, w: variant.length }
            ];
            
            let bestOrientation = null;
            let maxPallets = 0;
            
            orientations.forEach(orientation => {
                const palletsPerRowLength = Math.floor(containerData.length / orientation.l);
                const palletsPerRowWidth = Math.floor(containerData.width / orientation.w);
                const palletsPerLayer = palletsPerRowLength * palletsPerRowWidth;
                const maxLayers = Math.floor(containerData.height / variant.height);
                const totalPallets = palletsPerLayer * maxLayers;
                
                if (totalPallets > maxPallets) {
                    maxPallets = totalPallets;
                    bestOrientation = orientation;
                }
            });
            
            return bestOrientation || orientations[0];
        }
        
        generateMixedRecommendations(solution, variants, containerData, tolerance) {
            // For mixed loading, calculate potential improvement to full mixed capacity
            const mixedCapacity = this.calculateMixedLoading(containerData, variants);
            if (!mixedCapacity || mixedCapacity.totalNetWeight <= solution.totalNetWeight) {
                return { option1: [] };
            }
            
            const currentWeight = solution.totalNetWeight / 1000;
            const suggestedIncrease = (mixedCapacity.totalNetWeight - solution.totalNetWeight) / 1000;
            
            // Parse tolerance percentage and use it as threshold
            const toleranceDecimal = this.parseTolerancePercent(tolerance);
            const toleranceThreshold = currentWeight * toleranceDecimal;
            
            if (suggestedIncrease > toleranceThreshold) {
                const firstVariant = variants[Object.keys(variants)[0]];
                return {
                    option1: [
                        {
                            type: "dedicated",
                            action: "increase",
                            internalId: firstVariant.internalId,
                            parentID: firstVariant.parentID || firstVariant.internalId,
                            displayName: firstVariant.parentName || firstVariant.displayName.split(" AUTO")[0],
                            suggestedQty: suggestedIncrease.toFixed(3),
                            uom: "ton"
                        }
                    ]
                };
            }
            
            return { option1: [] };
        }
        
        /**
         * Generate recommendations for dual container setup
         */
        generateDualContainerRecommendations(solution, variants, containerData, tolerance) {
            // For dual container, calculate total possible capacity with both containers
            const firstVariantKey = Object.keys(variants)[0];
            const firstVariant = variants[firstVariantKey];
            
            // Calculate max capacity for dual container scenario
            const singleContainerCapacity = this.calculateMaxPalletsPerContainer(containerData, firstVariant);
            if (!singleContainerCapacity || !singleContainerCapacity.config) return { option1: [] };
            
            const maxPossiblePerContainer = singleContainerCapacity.maxPallets * firstVariant.netWeight / 1000;
            const maxTotalWeight = maxPossiblePerContainer * 2; // 2 containers
            
            const currentTotalWeight = solution.totalWeight / 1000;
            const suggestedIncrease = maxTotalWeight - currentTotalWeight;
            
            // Parse tolerance percentage and use it as threshold
            const toleranceDecimal = this.parseTolerancePercent(tolerance);
            const toleranceThreshold = currentTotalWeight * toleranceDecimal;
            
            if (suggestedIncrease > toleranceThreshold) {
                return {
                    option1: [
                        {
                            type: "dedicated",
                            action: "increase",
                            internalId: firstVariant.internalId,
                            parentID: firstVariant.parentID || firstVariant.internalId,
                            displayName: firstVariant.parentName || firstVariant.displayName.split(" AUTO")[0],
                            suggestedQty: suggestedIncrease.toFixed(3),
                            uom: "ton"
                        }
                    ]
                };
            }
            
            return { option1: [] };
        }
        
        /**
         * Generate alternative suggestions when no solution is found
         */
        generateAlternativeSuggestions(targetWeightKg, variants, variantCapacities, containerData) {
            const suggestions = [];
            
            // Calculate maximum possible with current container (including mixed loading)
            let maxPossible = 0;
            
            // Check single variant maximums
            Object.keys(variants).forEach(layer => {
                const capacity = variantCapacities[layer];
                if (capacity) {
                    const variantMax = capacity.maxPallets * variants[layer].netWeight;
                    maxPossible = Math.max(maxPossible, variantMax);
                }
            });
            
            // Check mixed loading maximum
            const mixedCapacity = this.calculateMixedLoading(containerData, variants);
            if (mixedCapacity) {
                maxPossible = Math.max(maxPossible, mixedCapacity.totalNetWeight);
            }
            
            // If target weight is too high, suggest reducing quantity
            if (targetWeightKg > maxPossible) {
                const maxPossibleTons = maxPossible / 1000;
                const reduction = (targetWeightKg - maxPossible) / 1000;
                
                suggestions.push({
                    type: "quantity_reduction",
                    action: "decrease",
                    suggestion: `Reduce quantity by ${reduction.toFixed(3)} tons`,
                    maxPossible: maxPossibleTons.toFixed(3),
                    suggestedQty: reduction.toFixed(3),
                    reason: `Current container can only hold maximum ${maxPossibleTons.toFixed(3)} tons`
                });
            }
            
            return suggestions;
        }
    }
    
    /**
     * Main entry point
     */
    function greedyCalcCutsize(inputData) {
        // Process input data with new format
        try {
            const calculator = new ContainerLoadingCalculator();
            const result = calculator.calculateOptimalLoading(inputData);
            log.debug('result', result);
            
            return result;
            
        } catch (error) {
            log.error('Container Loading Error', error);
            return {
                error: error.message,
                stack: error.stack
            };
        }
    }
    
    return {
        greedyCalcCutsize
    };
});