/**
 * @NApiVersion 2.1
 */
define([], function () {

    
    // ====================== MULTI PRODUCT (anti‑loop) =====================
    // Multi-product recommendations (single-container case only)
    function buildRecommendationsMultiProductSingleContainer(containers, metaByKey, boxesCutsize, container, S, L, config, inputData) {
        // Behavior:
        // - If utilization < threshold (default 90%): fill-to-full using ONE filler product only (chosen from items already present),
        //   and LOCK all other products to their current packed amounts (both inc/dec) to prevent reflow.
        // - If utilization >= threshold: reconcile so that Order == current PACKED (both inc/dec) — all in option1.
        // Output: { option1: [...] }
        
        const EPS = 0.05; // ~50 kg
        if (!containers || containers.length !== 1) return {};
        const cont = containers[0];
        const items = cont.item || [];
        if (!items.length) return {};
        
        // --- Helpers from meta ---
        function getHeightOfVariant(vk){ const m = metaByKey[vk]; return (m && +m.height) || 0; }
        function getNetPerPallet(vk){ const m = metaByKey[vk]; return (m && (+m.netWeightPerPalletMT || +m.wNetMT)) || 0; }
        function getGrossPerPallet(vk){ const m = metaByKey[vk]; return (m && +m.grossWeightPerPalletMT) || 0; }
        function getProductKey(vk){ const m = metaByKey[vk]; return (m && m.productKey) || null; }
        function repInternalId(pKey) {
            const found = items.find(it => (metaByKey[it.internalId] || {}).productKey === pKey);
            if (found) return found.internalId;
            for (const vk in metaByKey) { const m = metaByKey[vk]; if (m && m.productKey === pKey) return vk; }
            return null;
        }
        
        // --- Utilization ---
        const tolerancePct = parseFloat(String((inputData && inputData.tolerance) || '10').replace('%','')) || 10;
        const UTIL_THRESHOLD = (100 - tolerancePct) / 100;
        
        const lastNetNow = items.reduce((s, it) => s + (parseFloat(it.netWeight) || 0), 0);
        let theoreticalCapacity = null;
        if (typeof computeTheoreticalContainerCapacity === 'function') {
            theoreticalCapacity = computeTheoreticalContainerCapacity(metaByKey, container, S, L, config, containers, false);
        }
        const lastUtilNow = (theoreticalCapacity && theoreticalCapacity > 0) ? (lastNetNow / theoreticalCapacity) : 0;
        log.debug( 'last multi', {lastUtilNow, UTIL_THRESHOLD} )
        if (lastUtilNow >= UTIL_THRESHOLD) return {};
        // --- Packed totals per product ---
        const packedByProduct = {};
        for (const it of items) {
            const m = metaByKey[it.internalId];
            if (!m || !m.productKey) continue;
            const net = parseFloat(it.netWeight) || 0;
            if (net <= 0) continue;
            packedByProduct[m.productKey] = (packedByProduct[m.productKey] || 0) + net;
        }
        
        // === CASE B: utilization >= threshold => RECONCILE (all actions in option1)
        if (lastUtilNow + 1e-9 >= UTIL_THRESHOLD) {
            const option1 = [];
            for (const pKey of Object.keys(boxesCutsize || {})) {
                const orderQty = +boxesCutsize[pKey].weight || 0;
                const packedQty = +packedByProduct[pKey] || 0;
                const diff = packedQty - orderQty; // >0 increase, <0 decrease
                if (Math.abs(diff) > EPS) {
                    const repId = repInternalId(pKey);
                    option1.push({
                        type: "dedicated",
                        action: diff > 0 ? "increase" : "decrease",
                        internalId: repId || "",
                        parentID: findParentID(repId, metaByKey) || null,
                        displayName: findDisplayName(repId, metaByKey) || pKey,
                        suggestedQty: fixed3(Math.abs(diff)),
                        uom: "MT",
                        currentOrder: fixed3(orderQty),
                        targetWeight: fixed3(diff > 0 ? (orderQty + Math.abs(diff)) : (orderQty - Math.abs(diff))),
                        containers: 1,
                        loadingType: "match_packed_exact"
                    });
                }
            }
            const out = {}; if (option1.length) out.option1 = option1; return out;
        }
        
        // === CASE A: utilization < threshold => FILL using ONE FILLER ONLY & LOCK OTHERS ===
        // Build current pallet counts
        const placedRaw = cont.__placedRaw && Array.isArray(cont.__placedRaw) ? cont.__placedRaw : [];
        const baseCntByVar = {};
        if (placedRaw.length) {
            for (const p of placedRaw) baseCntByVar[p.variantKey] = (baseCntByVar[p.variantKey] || 0) + 1;
        } else {
            // fallback: estimate from items
            for (const it of items) {
                const vk = it.internalId; const netPP = getNetPerPallet(vk); const net = parseFloat(it.netWeight) || 0;
                if (vk && netPP > EPS) {
                    const est = Math.max(0, Math.round(net / netPP));
                    if (est > 0) baseCntByVar[vk] = (baseCntByVar[vk] || 0) + est;
                }
            }
        }
        
        // Candidates present now
        const presentVKs = Object.keys(baseCntByVar);
        if (!presentVKs.length) return {};
        const candidates = presentVKs
            .map(vk => ({ vk, h: getHeightOfVariant(vk), net: getNetPerPallet(vk), g: getGrossPerPallet(vk), pKey: getProductKey(vk) }))
            .filter(x => x.h > 0 && x.net > 0 && x.g > 0 && x.pKey)
            .map(x => ({ ...x, isTall: x.h >= container.height/2 - 1e-9 }));
        if (!candidates.length) return {};
        
        // Choose ONE filler: prefer non-tall; then higher net; tiebreak: lexicographic vk
        candidates.sort((a,b) => (Number(a.isTall) - Number(b.isTall)) || (b.net - a.net) || String(a.vk).localeCompare(String(b.vk)));
        const filler = candidates[0];
        
        // Rebuild column state from current pallets
        const maxStacks = (config && config.maxStacksPerColumn) ? config.maxStacksPerColumn : 2;
        const tallThreshold = container.height / 2;
        const cols = Array.from({ length: S }, () => ({ hUsed: 0, stacks: 0, hasTall: false }));
        let grossUsedNow = 0;
        function canPlaceOnCol(c, h, isTall) {
            if (c.stacks >= maxStacks) return false;
            if (c.hUsed + h > container.height + 1e-9) return false;
            if (isTall && c.hasTall) return false;
            return true;
        }
        // seed existing pallets by any order (use items order to be deterministic)
        for (const vk of presentVKs) {
            const times = baseCntByVar[vk] || 0;
            const h = getHeightOfVariant(vk); const isTall = h >= tallThreshold - 1e-9; const g = getGrossPerPallet(vk);
            for (let t = 0; t < times; t++) {
                let placed = false;
                for (let i = 0; i < S; i++) {
                    const c = cols[i];
                    if (!canPlaceOnCol(c, h, isTall)) continue;
                    if ((container.maxWeight || 0) > 0 && grossUsedNow + g > container.maxWeight + 1e-9) break;
                    c.hUsed = Math.round((c.hUsed + h) * 1e6) / 1e6;
                    c.stacks += 1; if (isTall) c.hasTall = true;
                    grossUsedNow = Math.round((grossUsedNow + g) * 1e6) / 1e6;
                    placed = true; break;
                }
                if (!placed) break; // abnormal overflow; just stop
            }
        }
        
        // Fill only with the chosen filler variant
        let fillerAddedCnt = 0;
        const fH = filler.h; const fIsTall = filler.isTall; const fG = filler.g; const fNet = filler.net;
        while (true) {
            let placed = false;
            for (let i = 0; i < S; i++) {
                const c = cols[i];
                if (!canPlaceOnCol(c, fH, fIsTall)) continue;
                if ((container.maxWeight || 0) > 0 && grossUsedNow + fG > container.maxWeight + 1e-9) { placed = false; break; }
                c.hUsed = Math.round((c.hUsed + fH) * 1e6) / 1e6;
                c.stacks += 1; if (fIsTall) c.hasTall = true;
                grossUsedNow = Math.round((grossUsedNow + fG) * 1e6) / 1e6;
                fillerAddedCnt += 1; placed = true; break;
            }
            if (!placed) break;
        }
        
        // Build unified option1: lock others to PACKED, filler => PACKED + added
        const option1 = [];
        
        // 1) Lock non-filler products
        for (const pKey of Object.keys(boxesCutsize || {})) {
            if (pKey === filler.pKey) continue;
            const orderQty = +boxesCutsize[pKey].weight || 0;
            const packedQty = +packedByProduct[pKey] || 0;
            const diff = packedQty - orderQty; // >0 inc, <0 dec to lock now
            if (Math.abs(diff) > EPS) {
                const repId = repInternalId(pKey);
                option1.push({
                    type: "dedicated",
                    action: diff > 0 ? "increase" : "decrease",
                    internalId: repId || "",
                    parentID: findParentID(repId, metaByKey) || null,
                    displayName: findDisplayName(repId, metaByKey) || pKey,
                    suggestedQty: fixed3((diff)),
                    uom: "MT",
                    currentOrder: fixed3(orderQty),
                    targetWeight: fixed3(diff > 0 ? (orderQty + Math.abs(diff)) : (orderQty - Math.abs(diff))),
                    containers: 1,
                    loadingType: "lock_current_mix"
                });
            }
        }
        
        // 2) Filler increase
        const fillerOrder = +(boxesCutsize[filler.pKey] ? boxesCutsize[filler.pKey].weight : 0) || 0;
        const fillerPackedNow = +packedByProduct[filler.pKey] || 0;
        const fillerTarget = fillerPackedNow + fillerAddedCnt * fNet;
        const fillerDiff = fillerTarget - fillerOrder; // should be >= 0 typically
        if (Math.abs(fillerDiff) > EPS) {
            const repId = repInternalId(filler.pKey) || filler.vk;
            option1.push({
                type: "dedicated",
                action: fillerDiff > 0 ? "increase" : "decrease",
                internalId: repId || "",
                parentID: findParentID(repId, metaByKey) || null,
                displayName: findDisplayName(repId, metaByKey) || filler.pKey,
                suggestedQty: fixed3((fillerDiff)),
                uom: "MT",
                currentOrder: fixed3(fillerOrder),
                targetWeight: fixed3(fillerOrder + fillerDiff),
                containers: 1,
                loadingType: "fill_with_filler_only"
            });
        }
        
        const out = {}; if (option1.length) out.option1 = option1; return out;
    }
    
// Multi-CONTAINER: fill the LAST container to full, lock others
    // Multi-CONTAINER: fill the LAST container to full, lock others
    function buildRecommendationsMultiProductMultiContainer(containers, metaByKey, boxesCutsize, container, S, L, config, inputData) {
        // Strategy:
        // - If last container utilization < threshold (default 90%):
        //     * Lock ALL non-filler products to their current TOTAL packed across ALL containers
        //     * Choose ONE filler variant that ALREADY exists in the LAST container
        //     * Fill ONLY that filler in the last container (geometry + maxWeight)
        //     * Recommend: lock lines (inc/dec) + one increase line for the filler (all in option1)
        // - If last container utilization >= threshold: reconcile globally (Order == total PACKED) — all in option1
        
        const EPS = 0.05; // ~50 kg
        if (!containers || containers.length < 2) return {};
        const N = containers.length;
        const last = containers[N - 1];
        const itemsLast = last.item || [];
        if (!itemsLast.length) return {};
        
        // --- Helpers ---
        function hOf(vk){ const m = metaByKey[vk]; return (m && +m.height) || 0; }
        function npp(vk){ const m = metaByKey[vk]; return (m && (+m.netWeightPerPalletMT || +m.wNetMT)) || 0; }
        function gpp(vk){ const m = metaByKey[vk]; return (m && +m.grossWeightPerPalletMT) || 0; }
        function pkey(vk){ const m = metaByKey[vk]; return (m && m.productKey) || null; }
        function repIdFor(pKey) {
            // prefer variant that appears anywhere; ideally in last
            let found = itemsLast.find(it => (metaByKey[it.internalId] || {}).productKey === pKey);
            if (found) return found.internalId;
            for (let c = 0; c < N; c++) {
                const its = (containers[c].item || []);
                const hit = its.find(it => (metaByKey[it.internalId] || {}).productKey === pKey);
                if (hit) return hit.internalId;
            }
            for (const vk in metaByKey) { const m = metaByKey[vk]; if (m && m.productKey === pKey) return vk; }
            return null;
        }
        
        // --- Capacity / utilization of last container ---
        let theoreticalCapacity = null;
        if (typeof computeTheoreticalContainerCapacity === 'function') {
            theoreticalCapacity = computeTheoreticalContainerCapacity(metaByKey, container, S, L, config, containers, false);
        }
        const lastNetNow = itemsLast.reduce((s, it) => s + (parseFloat(it.netWeight) || 0), 0);
        const lastUtilNow = (theoreticalCapacity && theoreticalCapacity > 0) ? (lastNetNow / theoreticalCapacity) : 0;
        const tolerancePct = parseFloat(String((inputData && inputData.tolerance) || '10').replace('%','')) || 10;
        const UTIL_THRESHOLD = (100 - tolerancePct) / 100;
        log.debug( 'last multi', {lastUtilNow, UTIL_THRESHOLD} )
        if (lastUtilNow >= UTIL_THRESHOLD) return {};
        
        // --- Totals packed by product across ALL containers (global lock state) ---
        const totalPackedByProduct = {};
        for (let ci = 0; ci < N; ci++) {
            const its = containers[ci].item || [];
            for (const it of its) {
                const m = metaByKey[it.internalId];
                if (!m || !m.productKey) continue;
                const net = parseFloat(it.netWeight) || 0;
                if (net <= 0) continue;
                totalPackedByProduct[m.productKey] = (totalPackedByProduct[m.productKey] || 0) + net;
            }
        }
        // --- Early stop: if Order already equals TOTAL PACKED across all containers, do not recommend ---
        let _allMatchedMulti = true;
        for (const pKey of Object.keys(boxesCutsize || {})) {
            const orderQty = +boxesCutsize[pKey].weight || 0;
            const packedQty = +totalPackedByProduct[pKey] || 0;
            if (Math.abs(packedQty - orderQty) > EPS) { _allMatchedMulti = false; break; }
        }
        if (_allMatchedMulti) return {};
        
        // === Case B: last container >= threshold => RECONCILE globally ===
        if (lastUtilNow + 1e-9 >= UTIL_THRESHOLD) {
            const option1 = [];
            for (const pKey of Object.keys(boxesCutsize || {})) {
                const orderQty = +boxesCutsize[pKey].weight || 0;
                const packedQty = +totalPackedByProduct[pKey] || 0;
                const diff = packedQty - orderQty; // >0 inc, <0 dec
                if (Math.abs(diff) > EPS) {
                    const repId = repIdFor(pKey);
                    option1.push({
                        type: "dedicated",
                        action: diff > 0 ? "increase" : "decrease",
                        internalId: repId || "",
                        parentID: findParentID(repId, metaByKey) || null,
                        displayName: findDisplayName(repId, metaByKey) || pKey,
                        suggestedQty: fixed3((diff)),
                        uom: "MT",
                        currentOrder: fixed3(orderQty),
                        targetWeight: fixed3(diff > 0 ? (orderQty + Math.abs(diff)) : (orderQty - Math.abs(diff))),
                        containers: N,
                        loadingType: "reconcile_multi"
                    });
                }
            }
            const out = {}; if (option1.length) out.option1 = option1; return out;
        }
        
        // === Case A: last container < threshold => Fill last container with ONE filler ===
        // Build base counts for LAST container
        const placedRawLast = last.__placedRaw && Array.isArray(last.__placedRaw) ? last.__placedRaw : [];
        const baseCntByVarLast = {};
        if (placedRawLast.length) {
            for (const p of placedRawLast) baseCntByVarLast[p.variantKey] = (baseCntByVarLast[p.variantKey] || 0) + 1;
        } else {
            for (const it of itemsLast) {
                const vk = it.internalId; const netPP = npp(vk); const net = parseFloat(it.netWeight) || 0;
                if (vk && netPP > EPS) {
                    const est = Math.max(0, Math.round(net / netPP));
                    if (est > 0) baseCntByVarLast[vk] = (baseCntByVarLast[vk] || 0) + est;
                }
            }
        }
        
        // Candidate variants: must exist in LAST container (avoid moving from earlier containers)
        const candVKs = Object.keys(baseCntByVarLast);
        if (!candVKs.length) return {};
        const candidates = candVKs
            .map(vk => ({ vk, h: hOf(vk), net: npp(vk), g: gpp(vk), pKey: pkey(vk) }))
            .filter(x => x.h > 0 && x.net > 0 && x.g > 0 && x.pKey)
            .map(x => ({ ...x, isTall: x.h >= container.height/2 - 1e-9 }));
        if (!candidates.length) return {};
        
        // Choose ONE filler in LAST: prefer non-tall then highest NET
        candidates.sort((a,b) => (Number(a.isTall) - Number(b.isTall)) || (b.net - a.net) || String(a.vk).localeCompare(String(b.vk)));
        const filler = candidates[0];
        
        // Reconstruct LAST container columns & current gross
        const maxStacks = (config && config.maxStacksPerColumn) ? config.maxStacksPerColumn : 2;
        const tallThreshold = container.height / 2;
        const cols = Array.from({ length: S }, () => ({ hUsed: 0, stacks: 0, hasTall: false }));
        let grossUsedNow = 0;
        function canPlaceOnCol(c, h, isTall) {
            if (c.stacks >= maxStacks) return false;
            if (c.hUsed + h > container.height + 1e-9) return false;
            if (isTall && c.hasTall) return false;
            return true;
        }
        for (const vk of candVKs) {
            const times = baseCntByVarLast[vk] || 0;
            const h = hOf(vk); const isTall = h >= tallThreshold - 1e-9; const g = gpp(vk);
            for (let t = 0; t < times; t++) {
                let placed = false;
                for (let i = 0; i < S; i++) {
                    const c = cols[i];
                    if (!canPlaceOnCol(c, h, isTall)) continue;
                    if ((container.maxWeight || 0) > 0 && grossUsedNow + g > container.maxWeight + 1e-9) break;
                    c.hUsed = Math.round((c.hUsed + h) * 1e6) / 1e6;
                    c.stacks += 1; if (isTall) c.hasTall = true;
                    grossUsedNow = Math.round((grossUsedNow + g) * 1e6) / 1e6;
                    placed = true; break;
                }
                if (!placed) break;
            }
        }
        
        // Fill LAST with the filler only
        let fillerAddedCnt = 0;
        const fH = filler.h, fIsTall = filler.isTall, fG = filler.g, fNet = filler.net;
        while (true) {
            let placed = false;
            for (let i = 0; i < S; i++) {
                const c = cols[i];
                if (!canPlaceOnCol(c, fH, fIsTall)) continue;
                if ((container.maxWeight || 0) > 0 && grossUsedNow + fG > container.maxWeight + 1e-9) { placed = false; break; }
                c.hUsed = Math.round((c.hUsed + fH) * 1e6) / 1e6;
                c.stacks += 1; if (fIsTall) c.hasTall = true;
                grossUsedNow = Math.round((grossUsedNow + fG) * 1e6) / 1e6;
                fillerAddedCnt += 1; placed = true; break;
            }
            if (!placed) break;
        }
        
        // Build recommendations
        const option1 = [];
        
        // 1) Lock ALL non-filler products to their current TOTAL packed across ALL containers
        for (const pKey of Object.keys(boxesCutsize || {})) {
            if (pKey === filler.pKey) continue;
            const orderQty = +boxesCutsize[pKey].weight || 0;
            const packedQty = +totalPackedByProduct[pKey] || 0;
            const diff = packedQty - orderQty; // >0 inc, <0 dec
            if (Math.abs(diff) > EPS) {
                const repId = repIdFor(pKey);
                option1.push({
                    type: "dedicated",
                    action: diff > 0 ? "increase" : "decrease",
                    internalId: repId || "",
                    parentID: findParentID(repId, metaByKey) || null,
                    displayName: findDisplayName(repId, metaByKey) || pKey,
                    suggestedQty: fixed3((diff)),
                    uom: "MT",
                    currentOrder: fixed3(orderQty),
                    targetWeight: fixed3(diff > 0 ? (orderQty + Math.abs(diff)) : (orderQty - Math.abs(diff))),
                    containers: N,
                    loadingType: "lock_prev_containers"
                });
            }
        }
        
        // 2) Filler increase for LAST container
        const fillerOrder = +(boxesCutsize[filler.pKey] ? boxesCutsize[filler.pKey].weight : 0) || 0;
        const fillerPackedTotalNow = +totalPackedByProduct[filler.pKey] || 0; // across all containers now
        const fillerTargetTotal = fillerPackedTotalNow + fillerAddedCnt * fNet;
        const fillerDiff = fillerTargetTotal - fillerOrder; // expected >= 0
        if (Math.abs(fillerDiff) > EPS) {
            const repId = repIdFor(filler.pKey) || filler.vk;
            option1.push({
                type: "dedicated",
                action: fillerDiff > 0 ? "increase" : "decrease",
                internalId: repId || "",
                parentID: findParentID(repId, metaByKey) || null,
                displayName: findDisplayName(repId, metaByKey) || filler.pKey,
                suggestedQty: fixed3(Math.abs(fillerDiff)),
                uom: "MT",
                currentOrder: fixed3(fillerOrder),
                targetWeight: fixed3(fillerOrder + fillerDiff),
                containers: N,
                loadingType: "fill_last_container_with_filler_only"
            });
        }
        
        const out = {}; if (option1.length) out.option1 = option1; return out;
    }

// Wrapper dispatcher for multi-product (future-proof)
    function buildRecommendationsMultiProduct(containers, metaByKey, boxesCutsize, container, S, L, config, inputData) {
        if (!containers) { return {}; }
        if(containers.length === 1)
            return buildRecommendationsMultiProductSingleContainer(containers, metaByKey, boxesCutsize, container, S, L, config, inputData);
        else
            return buildRecommendationsMultiProductMultiContainer(containers, metaByKey, boxesCutsize, container, S, L, config, inputData);
            
    }
    
    // ====================== HELPERS =====================
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
    
    // ====================== CAPACITY (theoretical) =====================
    function computeTheoreticalContainerCapacity(metaByKey, container, S, L, config, containers, isSingleProduct) {
        // Chỉ dùng actual container #1 nếu là single-product
        if (isSingleProduct === true && containers && containers.length > 1) {
            const firstContainer = containers[0];
            let actualNet = 0;
            for (const item of firstContainer.item || []) actualNet += parseFloat(item.netWeight || 0);
            if (actualNet > 0) return round6(actualNet);
        }
        
        // Hình học + tải trọng
        const variants = Object.keys(metaByKey).map(k => metaByKey[k]).filter(m => isNum(m.wNetMT) && isNum(m.height));
        const H = container.height;
        const tallTh = H / 2;
        let bestPerCol = 0;
        for (const a of variants) { if (a.height <= H + 1e-9) bestPerCol = Math.max(bestPerCol, a.wNetMT); }
        for (let i = 0; i < variants.length; i++) {
            const a = variants[i];
            for (let j = i; j < variants.length; j++) {
                const b = variants[j];
                const tallCount = ((a.height >= tallTh - 1e-9) ? 1 : 0) + ((b.height >= tallTh - 1e-9) ? 1 : 0);
                const hSum = (+a.height) + (+b.height);
                if (tallCount <= 1 && hSum <= H + 1e-9) bestPerCol = Math.max(bestPerCol, (+a.wNetMT) + (+b.wNetMT));
            }
        }
        const capGeom = S * bestPerCol;
        let lightestGross = Infinity;
        for (const v of variants) {
            if (v.grossWeightPerPalletMT && v.grossWeightPerPalletMT > 0) lightestGross = Math.min(lightestGross, v.grossWeightPerPalletMT);
        }
        let capWeight = container.maxWeight;
        if (lightestGross !== Infinity && lightestGross > 0) {
            const maxPallets = Math.floor(container.maxWeight / lightestGross);
            let bestNetPerPallet = 0;
            for (const v of variants) if (v.wNetMT > bestNetPerPallet) bestNetPerPallet = v.wNetMT;
            capWeight = maxPallets * bestNetPerPallet;
        }
        return round6(Math.min(capGeom, capWeight));
    }
    
    function fixed3(x) { return (Math.round((+x) * 1000) / 1000).toFixed(3); }
    function isNum(x) { return typeof x === 'number' && !isNaN(x); }
    function round6(x) { return Math.round((+x) * 1e6) / 1e6; }
    
    function roundUp3(num) {
        return Math.ceil(num * 1000) / 1000;
    }
    
    // ====================== SINGLE PRODUCT (giữ nguyên hành vi) =====================
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
        
        const theoreticalCapacity = computeTheoreticalContainerCapacity(
            metaByKey, container, S, L, config, containers, /*isSingleProduct=*/true
        );
        
        const out = {};
        
        // Option 1: Mua thêm để full tất cả containers hiện tại
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
                loadingType: "single_variant"
            }];
        }
        
        // Option 2: Giảm trong container cuối
        if (containers.length > 0) {
            const FULL_UTIL = 0.999;
            const THRESHOLD = utilizationThreshold;
            
            const totalPackedMT = containers.reduce((s, c) => s + (c.item || []).reduce((ss, it) => ss + (parseFloat(it.netWeight) || 0), 0), 0);
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
                        if (weightByProductInLast[pKey] > maxW) { maxW = weightByProductInLast[pKey]; chosenKey = pKey; }
                    }
                    if (!chosenKey) chosenKey = Object.keys(boxesCutsize)[0];
                    
                    const rep = (lastContainerItems.find(it => findProductKeyByInternalId(it.internalId, metaByKey) === chosenKey) || {});
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
                        loadingType: "decrease_to_full_containers"
                    });
                }
            } else if (lastUtil < THRESHOLD && containers.length > 1) {
                const productWeightInPreviousContainers = {};
                for (let i = 0; i < containers.length - 1; i++) {
                    for (const it of (containers[i].item || [])) {
                        const pKey = findProductKeyByInternalId(it.internalId, metaByKey);
                        if (!pKey) continue;
                        productWeightInPreviousContainers[pKey] = (productWeightInPreviousContainers[pKey] || 0) + (parseFloat(it.netWeight) || 0);
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
                            loadingType: "per_product_last_container"
                        });
                    }
                }
            }
            if (option2.length) out.option2 = option2;
        }
        
        return out;
    }
    
    
    
    // ====================== EXPORTS =====================
    // ====================== RECOMMENDATIONS (dispatcher) =====================
    function buildRecommendations(containers, metaByKey, boxesCutsize, container, S, L, config, inputData) {
        if (!containers || containers.length === 0) return {};
        const productCount = Object.keys(boxesCutsize || {}).length;
        if (productCount === 1) {
            return buildRecommendationsSingleProduct(
                containers, metaByKey, boxesCutsize, container, S, L, config, inputData
            );
        }
        // Multi‑product: dùng logic mới (chống loop) — có thể tối ưu tiếp sau
        return buildRecommendationsMultiProduct(
            containers, metaByKey, boxesCutsize, container, S, L, config, inputData
        );
    }
    
    return { buildRecommendations };
});
