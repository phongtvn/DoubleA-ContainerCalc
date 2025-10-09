/**
 * @NApiVersion 2.1
 * @description Container Packing Recommendations - Refactored
 *
 * Main Features:
 * - Single Product: Fill all containers or reduce last container
 * - Multi Product: Simple 3-case logic to avoid infinite loops
 *   - 1 container < upper threshold: Fill to full
 *   - Multiple containers, last < lower threshold: Remove last container
 *   - Multiple containers, last between thresholds: Fill last container
 *   - Last ≥ upper threshold: No recommendation
 *
 * Thresholds:
 * - Upper Threshold = 100% - tolerance (default: 90% when tolerance = 10%)
 * - Lower Threshold = tolerance (default: 10%)
 *
 * Example with tolerance = 10%:
 * - Last container 5% → Remove it
 * - Last container 50% → Fill to full
 * - Last container 95% → No recommendation
 *
 * Example with tolerance = 5%:
 * - Last container 3% → Remove it
 * - Last container 50% → Fill to full
 * - Last container 96% → No recommendation
 */
define([], function () {
    
    // ============================================================================
    // MAIN DISPATCHER
    // ============================================================================
    
    /**
     * Main entry point - routes to single or multi product logic
     */
    function buildRecommendations(containers, metaByKey, boxesCutsize, container, S, L, config, inputData) {
        if (!containers || containers.length === 0) {
            log.debug('buildRecommendations', 'No containers to process');
            return {};
        }
        
        const productCount = Object.keys(boxesCutsize || {}).length;
        
        log.debug('buildRecommendations', {
            productCount: productCount,
            containerCount: containers.length,
            type: productCount === 1 ? 'SINGLE_PRODUCT' : 'MULTI_PRODUCT'
        });
        
        if (productCount === 1) {
            return buildRecommendationsSingleProduct(
                containers, metaByKey, boxesCutsize, container, S, L, config, inputData
            );
        }
        
        return buildRecommendationsMultiProduct(
            containers, metaByKey, boxesCutsize, container, S, L, config, inputData
        );
    }
    
    // ============================================================================
    // MULTI-PRODUCT RECOMMENDATIONS (NEW LOGIC - NO LOOP)
    // ============================================================================
    
    /**
     * Multi-product recommendations with tolerance-based thresholds
     */
    function buildRecommendationsMultiProduct(containers, metaByKey, boxesCutsize, container, S, L, config, inputData) {
        if (!containers || containers.length === 0) return {};
        
        const EPS = 0.05; // 50kg threshold
        const tolerancePct = parseFloat(String((inputData && inputData.tolerance) || '10').replace('%','')) || 10;
        
        // Calculate thresholds from tolerance
        const LOWER_THRESHOLD = tolerancePct / 100;  // e.g., 10% → 0.10
        const UPPER_THRESHOLD = 1 - (tolerancePct / 100);  // e.g., 10% → 0.90
        
        // Calculate utilization of last container
        const lastContainer = containers[containers.length - 1];
        const lastUtil = calculateLastContainerUtilization(
            lastContainer, metaByKey, container, S, L, config, containers
        );
        
        log.debug('Multi-product recommendation', {
            containerCount: containers.length,
            lastUtilization: (lastUtil * 100).toFixed(2) + '%',
            tolerance: tolerancePct + '%',
            lowerThreshold: (LOWER_THRESHOLD * 100).toFixed(0) + '%',
            upperThreshold: (UPPER_THRESHOLD * 100).toFixed(0) + '%'
        });
        
        // ========== CASE A: SINGLE CONTAINER ==========
        if (containers.length === 1) {
            return handleSingleContainer(
                containers[0], metaByKey, boxesCutsize, container, S, L, config, lastUtil, UPPER_THRESHOLD, EPS
            );
        }
        
        // ========== CASE B: MULTIPLE CONTAINERS ==========
        
        // Case B1: Last container < lower threshold → Recommend DECREASE to remove it
        if (lastUtil < LOWER_THRESHOLD) {
            log.debug('Multi-product recommendation',
                'Last container < ' + (LOWER_THRESHOLD * 100).toFixed(0) + '%, recommending removal');
            return recommendDecreaseToRemoveLastContainer(containers, metaByKey, boxesCutsize, EPS);
        }
        
        // Case B2: Last container between thresholds → Fill to full
        if (lastUtil < UPPER_THRESHOLD) {
            log.debug('Multi-product recommendation',
                'Last container between ' + (LOWER_THRESHOLD * 100).toFixed(0) + '%-' +
                (UPPER_THRESHOLD * 100).toFixed(0) + '%, recommending fill');
            return recommendFillLastContainer(
                containers, metaByKey, boxesCutsize, container, S, L, config, EPS
            );
        }
        
        // Case B3: Last container ≥ upper threshold → No recommendation
        log.debug('Multi-product recommendation',
            'Last container ≥ ' + (UPPER_THRESHOLD * 100).toFixed(0) + '%, no recommendation needed');
        return {};
    }
    
    /**
     * Calculate utilization of last container (Multi-product)
     */
    function calculateLastContainerUtilization(lastContainer, metaByKey, container, S, L, config, containers) {
        const lastNetNow = (lastContainer.item || []).reduce((sum, item) => {
            return sum + (parseFloat(item.netWeight) || 0);
        }, 0);
        
        const theoreticalCapacity = computeMultiProductContainerCapacity(
            metaByKey, container, S, L, config
        );
        
        if (!theoreticalCapacity || theoreticalCapacity <= 0) {
            log.error('calculateLastContainerUtilization', 'Invalid theoretical capacity: ' + theoreticalCapacity);
            return 0;
        }
        
        const utilization = lastNetNow / theoreticalCapacity;
        
        log.debug('Last container utilization', {
            lastNetWeight: fixed3(lastNetNow) + ' MT',
            theoreticalCapacity: fixed3(theoreticalCapacity) + ' MT',
            utilization: (utilization * 100).toFixed(2) + '%'
        });
        
        return utilization;
    }
    
    /**
     * CASE A: Single container - fill to full
     * Lock all other products to their packed amounts, then fill with filler
     */
    function handleSingleContainer(container, metaByKey, boxesCutsize, containerData, S, L, config, currentUtil, upperThreshold, EPS) {
        log.debug('handleSingleContainer', {
            currentUtilization: (currentUtil * 100).toFixed(2) + '%',
            upperThreshold: (upperThreshold * 100).toFixed(0) + '%'
        });
        
        // If already ≥ upper threshold, no recommendation
        if (currentUtil >= upperThreshold) {
            log.debug('handleSingleContainer',
                'Already ≥ ' + (upperThreshold * 100).toFixed(0) + '%, no recommendation');
            return {};
        }
        
        // Get packed amounts for each product
        const packedByProduct = {};
        for (const item of (container.item || [])) {
            const pKey = findProductKeyByInternalId(item.internalId, metaByKey);
            if (!pKey) continue;
            const netWeight = parseFloat(item.netWeight) || 0;
            packedByProduct[pKey] = (packedByProduct[pKey] || 0) + netWeight;
        }
        
        // Choose filler: product with highest weight in current container
        const filler = chooseFiller(container, metaByKey, containerData);
        if (!filler) {
            log.error('handleSingleContainer', 'No valid filler found');
            return {};
        }
        
        // Calculate how much more filler can fit
        const additionalWeight = simulateFillContainer(
            container, filler, metaByKey, containerData, S, config
        );
        
        if (additionalWeight < EPS) {
            log.debug('handleSingleContainer', 'Cannot add more weight');
            return {};
        }
        
        // Build recommendations: lock others + increase filler
        const recommendations = [];
        
        // 1. Lock all non-filler products to their packed amounts
        for (const pKey in boxesCutsize) {
            if (pKey === filler.pKey) continue; // Skip filler, handle separately
            
            const orderQty = +(boxesCutsize[pKey]?.weight || 0);
            const packedQty = packedByProduct[pKey] || 0;
            const diff = packedQty - orderQty;
            
            if (Math.abs(diff) >= EPS) {
                const repId = getRepresentativeVariantId(pKey, metaByKey, [container]);
                recommendations.push({
                    type: "dedicated",
                    action: diff > 0 ? "increase" : "decrease",
                    internalId: repId || "",
                    parentID: findParentID(repId, metaByKey) || null,
                    displayName: findDisplayName(repId, metaByKey) || pKey,
                    suggestedQty: fixed3(diff),  // Positive for increase, negative for decrease
                    uom: "MT",
                    currentOrder: fixed3(orderQty),
                    targetWeight: fixed3(packedQty),
                    containers: 1,
                    loadingType: "lock_to_packed"
                });
            }
        }
        
        // 2. Increase filler to fill container
        const fillerProductKey = filler.pKey;
        const fillerCurrentOrder = +(boxesCutsize[fillerProductKey]?.weight || 0);
        const fillerPacked = packedByProduct[fillerProductKey] || 0;
        const fillerTotal = fillerPacked + additionalWeight;
        const fillerDiff = fillerTotal - fillerCurrentOrder;
        
        recommendations.push({
            type: "dedicated",
            action: "increase",
            internalId: filler.vk,
            parentID: findParentID(filler.vk, metaByKey) || null,
            displayName: findDisplayName(filler.vk, metaByKey) || fillerProductKey,
            suggestedQty: fixed3(fillerDiff),  // Total adjustment (packed + additional - order)
            uom: "MT",
            currentOrder: fixed3(fillerCurrentOrder),
            targetWeight: fixed3(fillerTotal),
            containers: 1,
            loadingType: "fill_single_container"
        });
        
        log.debug('handleSingleContainer recommendations', {
            lockCount: recommendations.length - 1,
            fillerProduct: fillerProductKey,
            fillerAdditional: fixed3(additionalWeight) + ' MT'
        });
        
        return { option1: recommendations };
    }
    
    /**
     * CASE B1: Recommend DECREASE to remove last container (< lower threshold)
     */
    function recommendDecreaseToRemoveLastContainer(containers, metaByKey, boxesCutsize, EPS) {
        const N = containers.length;
        log.debug('recommendDecreaseToRemoveLastContainer', 'Removing container ' + N + ' of ' + N);
        
        if (N < 2) {
            log.debug('recommendDecreaseToRemoveLastContainer', 'Only 1 container, cannot remove');
            return {};
        }
        
        const lastContainer = containers[N - 1];
        const recommendations = [];
        
        // Get all products in last container
        const productsInLast = {};
        for (const item of (lastContainer.item || [])) {
            const pKey = findProductKeyByInternalId(item.internalId, metaByKey);
            if (!pKey) continue;
            
            const netWeight = parseFloat(item.netWeight) || 0;
            productsInLast[pKey] = (productsInLast[pKey] || 0) + netWeight;
        }
        
        // Recommend decreasing each product by its amount in last container
        for (const pKey in productsInLast) {
            const decreaseAmount = productsInLast[pKey];
            if (decreaseAmount < EPS) continue;
            
            const currentOrder = +(boxesCutsize[pKey]?.weight || 0);
            const repId = getRepresentativeVariantId(pKey, metaByKey, containers);
            
            recommendations.push({
                type: "dedicated",
                action: "decrease",
                internalId: repId || "",
                parentID: findParentID(repId, metaByKey) || null,
                displayName: findDisplayName(repId, metaByKey) || pKey,
                suggestedQty: fixed3(-decreaseAmount),  // ← SỐ ÂM cho decrease
                uom: "MT",
                currentOrder: fixed3(currentOrder),
                targetWeight: fixed3(Math.max(0, currentOrder - decreaseAmount)),
                containers: N - 1,
                loadingType: "remove_last_container"
            });
        }
        
        return recommendations.length > 0 ? { option1: recommendations } : {};
    }
    
    /**
     * CASE B2: Fill last container to full (between thresholds)
     * Lock all other products to their total packed amounts across all containers, then fill with filler
     */
    function recommendFillLastContainer(containers, metaByKey, boxesCutsize, containerData, S, L, config, EPS) {
        const N = containers.length;
        const lastContainer = containers[N - 1];
        
        log.debug('recommendFillLastContainer', 'Filling last container ' + N + ' of ' + N);
        
        // Get TOTAL packed amounts for each product across ALL containers
        const totalPackedByProduct = {};
        for (let i = 0; i < N; i++) {
            for (const item of (containers[i].item || [])) {
                const pKey = findProductKeyByInternalId(item.internalId, metaByKey);
                if (!pKey) continue;
                const netWeight = parseFloat(item.netWeight) || 0;
                totalPackedByProduct[pKey] = (totalPackedByProduct[pKey] || 0) + netWeight;
            }
        }
        
        // Choose filler from last container
        const filler = chooseFiller(lastContainer, metaByKey, containerData);
        if (!filler) {
            log.error('recommendFillLastContainer', 'No valid filler found in last container');
            return {};
        }
        
        // Calculate additional weight for filler
        const additionalWeight = simulateFillContainer(
            lastContainer, filler, metaByKey, containerData, S, config
        );
        
        if (additionalWeight < EPS) {
            log.debug('recommendFillLastContainer', 'Cannot add more weight to last container');
            return {};
        }
        
        // Build recommendations: lock others + increase filler
        const recommendations = [];
        
        // 1. Lock all non-filler products to their TOTAL packed amounts
        for (const pKey in boxesCutsize) {
            if (pKey === filler.pKey) continue; // Skip filler, handle separately
            
            const orderQty = +(boxesCutsize[pKey]?.weight || 0);
            const totalPacked = totalPackedByProduct[pKey] || 0;
            const diff = totalPacked - orderQty;
            
            if (Math.abs(diff) >= EPS) {
                const repId = getRepresentativeVariantId(pKey, metaByKey, containers);
                recommendations.push({
                    type: "dedicated",
                    action: diff > 0 ? "increase" : "decrease",
                    internalId: repId || "",
                    parentID: findParentID(repId, metaByKey) || null,
                    displayName: findDisplayName(repId, metaByKey) || pKey,
                    suggestedQty: fixed3(diff),  // Positive for increase, negative for decrease
                    uom: "MT",
                    currentOrder: fixed3(orderQty),
                    targetWeight: fixed3(totalPacked),
                    containers: N,
                    loadingType: "lock_to_packed"
                });
            }
        }
        
        // 2. Increase filler to fill last container
        const fillerProductKey = filler.pKey;
        const fillerCurrentOrder = +(boxesCutsize[fillerProductKey]?.weight || 0);
        const fillerTotalPacked = totalPackedByProduct[fillerProductKey] || 0;
        const fillerTotal = fillerTotalPacked + additionalWeight;
        const fillerDiff = fillerTotal - fillerCurrentOrder;
        
        recommendations.push({
            type: "dedicated",
            action: "increase",
            internalId: filler.vk,
            parentID: findParentID(filler.vk, metaByKey) || null,
            displayName: findDisplayName(filler.vk, metaByKey) || fillerProductKey,
            suggestedQty: fixed3(fillerDiff),  // Total adjustment (total packed + additional - order)
            uom: "MT",
            currentOrder: fixed3(fillerCurrentOrder),
            targetWeight: fixed3(fillerTotal),
            containers: N,
            loadingType: "fill_last_container"
        });
        
        log.debug('recommendFillLastContainer recommendations', {
            lockCount: recommendations.length - 1,
            fillerProduct: fillerProductKey,
            fillerAdditional: fixed3(additionalWeight) + ' MT'
        });
        
        return { option1: recommendations };
    }
    
    /**
     * Choose best filler variant from container
     * Priority: Non-tall > Higher net weight
     */
    function chooseFiller(container, metaByKey, containerData) {
        const items = container.item || [];
        if (items.length === 0) return null;
        
        const tallThreshold = containerData.height / 2;
        const candidates = [];
        
        // Build candidate list
        for (const item of items) {
            const vk = item.internalId;
            const meta = metaByKey[vk];
            if (!meta) continue;
            
            const h = +meta.height || 0;
            const net = +meta.netWeightPerPalletMT || +meta.wNetMT || 0;
            const gross = +meta.grossWeightPerPalletMT || 0;
            const pKey = meta.productKey;
            
            if (h <= 0 || net <= 0 || gross <= 0 || !pKey) continue;
            
            candidates.push({
                vk: vk,
                pKey: pKey,
                h: h,
                net: net,
                gross: gross,
                isTall: h >= tallThreshold - 1e-9
            });
        }
        
        if (candidates.length === 0) return null;
        
        // Sort: Non-tall first, then highest net weight
        candidates.sort((a, b) => {
            if (a.isTall !== b.isTall) return a.isTall ? 1 : -1;
            return b.net - a.net;
        });
        
        log.debug('chooseFiller', {
            chosen: candidates[0].pKey,
            isTall: candidates[0].isTall,
            netWeight: fixed3(candidates[0].net) + ' MT'
        });
        
        return candidates[0];
    }
    
    /**
     * Simulate filling container with filler variant
     * Returns additional weight that can be added (NET weight)
     */
    function simulateFillContainer(container, filler, metaByKey, containerData, S, config) {
        const maxStacks = (config && config.maxStacksPerColumn) ? config.maxStacksPerColumn : 2;
        const tallThreshold = containerData.height / 2;
        
        // Rebuild current column state
        const placedRaw = container.__placedRaw || [];
        const cols = Array.from({ length: S }, () => ({
            hUsed: 0,
            stacks: 0,
            hasTall: false
        }));
        
        let grossUsed = 0;
        
        // Place existing pallets
        for (const p of placedRaw) {
            const meta = metaByKey[p.variantKey];
            if (!meta) continue;
            
            const h = +meta.height || 0;
            const g = +meta.grossWeightPerPalletMT || 0;
            const isTall = h >= tallThreshold - 1e-9;
            
            // Find column for this pallet
            for (let i = 0; i < S; i++) {
                const col = cols[i];
                if (col.stacks >= maxStacks) continue;
                if (col.hUsed + h > containerData.height + 1e-9) continue;
                if (isTall && col.hasTall) continue;
                
                col.hUsed = round6(col.hUsed + h);
                col.stacks += 1;
                if (isTall) col.hasTall = true;
                grossUsed = round6(grossUsed + g);
                break;
            }
        }
        
        // Try to add filler pallets
        const fH = filler.h;
        const fIsTall = filler.isTall;
        const fGross = filler.gross;
        const fNet = filler.net;
        
        let addedCount = 0;
        let weightLeft = containerData.maxWeight - grossUsed;
        
        while (weightLeft > fGross - 1e-9) {
            let placed = false;
            
            for (let i = 0; i < S; i++) {
                const col = cols[i];
                if (col.stacks >= maxStacks) continue;
                if (col.hUsed + fH > containerData.height + 1e-9) continue;
                if (fIsTall && col.hasTall) continue;
                
                col.hUsed = round6(col.hUsed + fH);
                col.stacks += 1;
                if (fIsTall) col.hasTall = true;
                weightLeft = round6(weightLeft - fGross);
                addedCount++;
                placed = true;
                break;
            }
            
            if (!placed) break;
        }
        
        const additionalWeight = addedCount * fNet;
        
        log.debug('simulateFillContainer', {
            fillerProduct: filler.pKey,
            palletsAdded: addedCount,
            additionalWeight: fixed3(additionalWeight) + ' MT'
        });
        
        return additionalWeight;
    }
    
    /**
     * Get representative variant ID for a product
     */
    function getRepresentativeVariantId(productKey, metaByKey, containers) {
        // Try to find in any container
        for (const cont of containers) {
            for (const item of (cont.item || [])) {
                const meta = metaByKey[item.internalId];
                if (meta && meta.productKey === productKey) {
                    return item.internalId;
                }
            }
        }
        
        // Fallback: find any variant with this product key
        for (const vk in metaByKey) {
            const meta = metaByKey[vk];
            if (meta && meta.productKey === productKey) {
                return vk;
            }
        }
        
        return null;
    }
    
    /**
     * Compute theoretical container capacity for multi-product
     * Based on geometry and weight constraints
     */
    function computeMultiProductContainerCapacity(metaByKey, container, S, L, config) {
        // Get all valid variants
        const variants = Object.keys(metaByKey)
            .map(k => metaByKey[k])
            .filter(m => isNum(m.wNetMT) && isNum(m.height));
        
        if (variants.length === 0) {
            log.error('computeMultiProductContainerCapacity', 'No valid variants found');
            return 0;
        }
        
        const H = container.height;
        const tallThreshold = H / 2;
        let bestPerCol = 0;
        
        // Case 1: Single pallet per column
        for (const variant of variants) {
            if (variant.height <= H + 1e-9) {
                bestPerCol = Math.max(bestPerCol, variant.wNetMT);
            }
        }
        
        // Case 2: Two pallets per column (if tall constraint allows)
        for (let i = 0; i < variants.length; i++) {
            const variantA = variants[i];
            
            for (let j = i; j < variants.length; j++) {
                const variantB = variants[j];
                
                // Count "tall" pallets (> H/2)
                const tallCount = (variantA.height >= tallThreshold - 1e-9 ? 1 : 0) +
                    (variantB.height >= tallThreshold - 1e-9 ? 1 : 0);
                
                const totalHeight = variantA.height + variantB.height;
                
                // Allow max 1 tall pallet per column
                if (tallCount <= 1 && totalHeight <= H + 1e-9) {
                    const combinedWeight = variantA.wNetMT + variantB.wNetMT;
                    bestPerCol = Math.max(bestPerCol, combinedWeight);
                }
            }
        }
        
        // Capacity by geometry (columns * best weight per column)
        const capacityGeometry = S * bestPerCol;
        
        // Capacity by weight constraint
        let lightestGrossWeight = Infinity;
        for (const variant of variants) {
            if (variant.grossWeightPerPalletMT && variant.grossWeightPerPalletMT > 0) {
                lightestGrossWeight = Math.min(lightestGrossWeight, variant.grossWeightPerPalletMT);
            }
        }
        
        let capacityWeight = container.maxWeight;
        if (lightestGrossWeight !== Infinity && lightestGrossWeight > 0) {
            // Max pallets by weight
            const maxPallets = Math.floor(container.maxWeight / lightestGrossWeight);
            
            // Best net weight per pallet
            let bestNetPerPallet = 0;
            for (const variant of variants) {
                if (variant.wNetMT > bestNetPerPallet) {
                    bestNetPerPallet = variant.wNetMT;
                }
            }
            
            capacityWeight = maxPallets * bestNetPerPallet;
        }
        
        const finalCapacity = Math.min(capacityGeometry, capacityWeight);
        
        log.debug('Multi-product capacity', {
            method: 'theoretical_calculation',
            capacityGeometry: fixed3(capacityGeometry) + ' MT',
            capacityWeight: fixed3(capacityWeight) + ' MT',
            finalCapacity: fixed3(finalCapacity) + ' MT',
            limitedBy: finalCapacity === capacityGeometry ? 'geometry' : 'weight'
        });
        
        return round6(finalCapacity);
    }
    
    
    // ============================================================================
    // SINGLE PRODUCT RECOMMENDATIONS (ORIGINAL LOGIC)
    // ============================================================================
    
    /**
     * Single product recommendations
     */
    function buildRecommendationsSingleProduct(containers, metaByKey, boxesCutsize, container, S, L, config, inputData) {
        if (!containers || containers.length === 0) return {};
        
        const totalOrderMT = Object.keys(boxesCutsize || {}).reduce((s, k) => s + (+boxesCutsize[k].weight || 0), 0);
        if (totalOrderMT <= 0) return {};
        
        const lastContainer = containers[containers.length - 1];
        const lastContainerItems = lastContainer.item || [];
        if (lastContainerItems.length === 0) return {};
        
        const tolerancePct = parseFloat(String((inputData.tolerance || '')).replace('%', '')) || 10;
        const utilizationThreshold = (100 - tolerancePct) / 100;
        
        let maxItem = null, maxWeight = 0;
        for (const item of lastContainerItems) {
            const itemNet = parseFloat(item.netWeight || 0);
            if (itemNet > maxWeight) { maxWeight = itemNet; maxItem = item; }
        }
        if (!maxItem) return {};
        
        const theoreticalCapacity = computeSingleProductContainerCapacity(
            metaByKey, container, S, L, config, containers
        );
        
        if (theoreticalCapacity <= 0) {
            log.error('buildRecommendationsSingleProduct', 'Invalid theoretical capacity');
            return {};
        }
        
        const out = {};
        
        // Option 1: Buy more to fill all current containers
        const currentContainerCount = containers.length;
        const targetOrderWeight = currentContainerCount * theoreticalCapacity;
        const shortfallToOrder = targetOrderWeight - totalOrderMT;
        
        if (shortfallToOrder >= 0.001) {
            out.option1 = [{
                type: "dedicated",
                action: "increase",
                internalId: maxItem.internalId || "",
                parentID: findParentID(maxItem.internalId, metaByKey) || null,
                displayName: findDisplayName(maxItem.internalId, metaByKey) || maxItem.displayName || "",
                suggestedQty: fixed3(shortfallToOrder),
                uom: "MT",
                currentOrder: fixed3(totalOrderMT),
                targetWeight: fixed3(targetOrderWeight),
                containers: 0,
                loadingType: "single_product_fill_all"
            }];
        }
        
        // Option 2: Reduce in last container
        if (containers.length > 0) {
            const FULL_UTIL = 0.999;
            const THRESHOLD = utilizationThreshold;
            
            const totalPackedMT = containers.reduce((s, c) =>
                s + (c.item || []).reduce((ss, it) => ss + (parseFloat(it.netWeight) || 0), 0), 0);
            const lastNet = lastContainerItems.reduce((s, it) => s + (parseFloat(it.netWeight) || 0), 0);
            const lastUtil = theoreticalCapacity > 0 ? lastNet / theoreticalCapacity : 0;
            
            const option2 = [];
            
            if (lastUtil >= FULL_UTIL) {
                const overage = Math.max(0, totalOrderMT - totalPackedMT);
                if (overage > 0.001) {
                    const weightByProductInLast = {};
                    for (const it of lastContainerItems) {
                        const pKey = findProductKeyByInternalId(it.internalId, metaByKey);
                        if (!pKey) continue;
                        weightByProductInLast[pKey] = (weightByProductInLast[pKey] || 0) + (parseFloat(it.netWeight) || 0);
                    }
                    
                    let chosenKey = null, maxW = -1;
                    for (const pKey in weightByProductInLast) {
                        if (weightByProductInLast[pKey] > maxW) {
                            maxW = weightByProductInLast[pKey];
                            chosenKey = pKey;
                        }
                    }
                    if (!chosenKey) chosenKey = Object.keys(boxesCutsize)[0];
                    
                    const rep = (lastContainerItems.find(it =>
                        findProductKeyByInternalId(it.internalId, metaByKey) === chosenKey) || {});
                    const orderQtyChosen = (boxesCutsize[chosenKey]?.weight || 0);
                    const suggest = Math.min(overage, orderQtyChosen);
                    
                    option2.push({
                        type: "dedicated",
                        action: "decrease",
                        internalId: "",
                        parentID: findParentID(rep.internalId, metaByKey) || null,
                        displayName: findDisplayName(rep.internalId, metaByKey) || chosenKey,
                        suggestedQty: fixed3(suggest),
                        uom: "MT",
                        currentOrder: fixed3(orderQtyChosen),
                        targetWeight: fixed3(orderQtyChosen - suggest),
                        containers: containers.length,
                        loadingType: "single_product_decrease_to_full"
                    });
                }
            } else if (lastUtil < THRESHOLD && containers.length > 1) {
                const productWeightInPreviousContainers = {};
                for (let i = 0; i < containers.length - 1; i++) {
                    for (const it of (containers[i].item || [])) {
                        const pKey = findProductKeyByInternalId(it.internalId, metaByKey);
                        if (!pKey) continue;
                        productWeightInPreviousContainers[pKey] =
                            (productWeightInPreviousContainers[pKey] || 0) + (parseFloat(it.netWeight) || 0);
                    }
                }
                
                const processedProducts = new Set();
                for (const it of lastContainerItems) {
                    const pKey = findProductKeyByInternalId(it.internalId, metaByKey);
                    if (!pKey || processedProducts.has(pKey)) continue;
                    processedProducts.add(pKey);
                    
                    const orderQty = boxesCutsize[pKey]?.weight || 0;
                    const qtyPrev = productWeightInPreviousContainers[pKey] || 0;
                    const reductionQty = Math.max(0, orderQty - qtyPrev);
                    
                    if (reductionQty > 0.001) {
                        option2.push({
                            type: "dedicated",
                            action: "decrease",
                            internalId: "",
                            parentID: findParentID(it.internalId, metaByKey) || null,
                            displayName: findDisplayName(it.internalId, metaByKey) || pKey,
                            suggestedQty: fixed3(reductionQty),
                            uom: "MT",
                            currentOrder: fixed3(orderQty),
                            targetWeight: fixed3(qtyPrev),
                            containers: Math.max(0, containers.length - 1),
                            loadingType: "single_product_decrease_last"
                        });
                    }
                }
            }
            
            if (option2.length) out.option2 = option2;
        }
        
        return out;
    }
    
    /**
     * Compute container capacity for single product
     * Uses actual weight from first container if multiple containers exist
     */
    function computeSingleProductContainerCapacity(metaByKey, container, S, L, config, containers) {
        // Use actual weight from first container if available
        if (containers && containers.length > 1) {
            const firstContainer = containers[0];
            let actualNet = 0;
            for (const item of firstContainer.item || []) {
                actualNet += parseFloat(item.netWeight || 0);
            }
            if (actualNet > 0) {
                log.debug('Single-product capacity', {
                    method: 'actual_from_first_container',
                    capacity: fixed3(actualNet) + ' MT'
                });
                return round6(actualNet);
            }
        }
        
        // Fallback: calculate theoretical capacity
        const variants = Object.keys(metaByKey)
            .map(k => metaByKey[k])
            .filter(m => isNum(m.wNetMT) && isNum(m.height));
        
        const H = container.height;
        const tallTh = H / 2;
        let bestPerCol = 0;
        
        // Single pallet per column
        for (const a of variants) {
            if (a.height <= H + 1e-9) {
                bestPerCol = Math.max(bestPerCol, a.wNetMT);
            }
        }
        
        // Two pallets per column
        for (let i = 0; i < variants.length; i++) {
            const a = variants[i];
            for (let j = i; j < variants.length; j++) {
                const b = variants[j];
                const tallCount = ((a.height >= tallTh - 1e-9) ? 1 : 0) +
                    ((b.height >= tallTh - 1e-9) ? 1 : 0);
                const hSum = (+a.height) + (+b.height);
                if (tallCount <= 1 && hSum <= H + 1e-9) {
                    bestPerCol = Math.max(bestPerCol, (+a.wNetMT) + (+b.wNetMT));
                }
            }
        }
        
        const capGeom = S * bestPerCol;
        
        // Weight constraint
        let lightestGross = Infinity;
        for (const v of variants) {
            if (v.grossWeightPerPalletMT && v.grossWeightPerPalletMT > 0) {
                lightestGross = Math.min(lightestGross, v.grossWeightPerPalletMT);
            }
        }
        
        let capWeight = container.maxWeight;
        if (lightestGross !== Infinity && lightestGross > 0) {
            const maxPallets = Math.floor(container.maxWeight / lightestGross);
            let bestNetPerPallet = 0;
            for (const v of variants) {
                if (v.wNetMT > bestNetPerPallet) bestNetPerPallet = v.wNetMT;
            }
            capWeight = maxPallets * bestNetPerPallet;
        }
        
        const finalCapacity = round6(Math.min(capGeom, capWeight));
        
        log.debug('Single-product capacity', {
            method: 'theoretical_calculation',
            capacity: fixed3(finalCapacity) + ' MT'
        });
        
        return finalCapacity;
    }
    
    // ============================================================================
    // UTILITY FUNCTIONS
    // ============================================================================
    
    function findProductKeyByInternalId(internalId, metaByKey) {
        const meta = metaByKey[internalId];
        return meta ? meta.productKey : null;
    }
    
    function findParentID(internalId, metaByKey) {
        if (!internalId) return null;
        const meta = metaByKey[internalId];
        return meta ? meta.parentID : null;
    }
    
    function findDisplayName(internalId, metaByKey) {
        if (!internalId) return null;
        const meta = metaByKey[internalId];
        return meta ? meta.parentName : null;
    }
    
    function fixed3(x) {
        return (Math.round((+x) * 1000) / 1000).toFixed(3);
    }
    
    function round6(x) {
        return Math.round((+x) * 1e6) / 1e6;
    }
    
    function isNum(x) {
        return typeof x === 'number' && !isNaN(x);
    }
    
    // ============================================================================
    // EXPORTS
    // ============================================================================
    
    return {
        buildRecommendations: buildRecommendations
    };
});