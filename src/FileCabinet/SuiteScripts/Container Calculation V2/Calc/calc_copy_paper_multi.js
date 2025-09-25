/**
 * @NApiVersion 2.1
 */
define([], function () {
    
    const imgurl = "https://sca.doubleapaper.com/assets/Container_Image/container.png";
    
    // Variant color palette (hex strings) — màu ổn định theo variant
    const COLORS = [
        "0x191970", // Midnight Blue
        "0x8B0000", // Dark Red
        "0x008000", // Green
        "0xFFA500", // Orange
        "0x800080", // Purple
        "0xFFFF00", // Yellow
        "0x00FFFF", // Cyan
        "0xFF00FF", // Magenta
        "0xFF4500", // Orange Red
        "0x2E8B57", // Sea Green
        "0x4682B4", // Steel Blue
        "0xDAA520", // Golden Rod
        "0xADFF2F", // Green Yellow
        "0xFF6347", // Tomato
        "0x9400D3", // Dark Violet
        "0xFFD700"  // Gold
    ];
    
    /**
     * Entry point
     */
    function greedyCalcCutsize(inputData) {
        try {
            const result = calculateOptimalPacking(inputData);
            log.debug('Multi-product container packing result', truncateLog(result));
            return result;
        } catch (error) {
            log.error('Multi-product container packing error', error);
            return { error: error.message, stack: error.stack };
        }
    }
    
    // ============================== CORE ===============================
    
    function calculateOptimalPacking(inputData) {
        const action = inputData.action || 'viewContainerList';
        const containerRaw = inputData.containerData || inputData.containerSize;
        assert(containerRaw, 'Missing containerData/containerSize');
        const container = normalizeContainer(containerRaw);
        const config = normalizeConfig(inputData.config);
        
        // Build normalized products & variant meta index
        const { products, variantMetaByKey } = buildProductsAndMeta(inputData.boxesCutsize || {}, config);
        const anyVariant = findAnyVariant(products);
        assert(anyVariant, 'No variants provided');
        const sharedFootprint = { length: anyVariant.length, width: anyVariant.width };
        
        // Slots / tầng
        const S = computeSlots(container, sharedFootprint); // pallet per floor
        // L: số tầng khả dụng
        let L = Math.max(1, +config.maxStackLayers || 1);
        if (config.strictStackHeightCheck && L > 1) {
            const tallest = Math.max(...products.flatMap(p => p.variants.map(v => v.height)));
            while (L > 1 && tallest > (container.height / L)) L--;
        }
        const effectiveSlots = S * L;
        assert(effectiveSlots > 0, 'Effective slots is 0. Check sizes/stack config.');
        
        // Lọc theo chiều cao (nếu strict theo tầng)
        for (const p of products) {
            p.variants = p.variants.filter(v => v.height <= (config.strictStackHeightCheck ? (container.height / L) : container.height));
        }
        assert(products.every(p => p.variants.length > 0), 'Some product has no height-fitting variants');
        
        // Remain weights per product (MT)
        const remain = {};
        for (const p of products) remain[p.productKey] = round6(p.requiredWeightMT);
        
        const containers = [];
        let containerIndex = 0;
        
        // Pack while still need weight
        while (sumRemain(remain) > 1e-9) {
            containerIndex++;
            let slotsLeft = effectiveSlots;
            let weightLeft = container.maxWeight;
            const placed = []; // {productKey, variantKey, wMT}
            
            const variantCountByKey = {};
            const totalRemain = sumRemain(remain);
            const t = Math.min(totalRemain / Math.max(1, slotsLeft), container.maxWeight / Math.max(1, slotsLeft));
            
            // Greedy fill
            let candidates = buildCandidates(products, remain);
            while (slotsLeft > 0 && weightLeft > 1e-9) {
                candidates = scoreAndSortCandidates(candidates, remain, t, config);
                
                let placedSomething = false;
                for (let i = 0; i < candidates.length; i++) {
                    const c = candidates[i];
                    if (remain[c.productKey] <= 1e-9) continue;
                    if (c.wMT - 1e-9 > weightLeft) continue;
                    
                    if (config.maxVariantsPerContainer != null) {
                        const distinctNow = Object.keys(variantCountByKey).length;
                        const has = !!variantCountByKey[c.variantKey];
                        if (!has && distinctNow >= config.maxVariantsPerContainer) continue;
                    }
                    
                    placed.push({ productKey: c.productKey, variantKey: c.variantKey, wMT: c.wMT });
                    slotsLeft--;
                    weightLeft = round6(weightLeft - c.wMT);
                    remain[c.productKey] = Math.max(0, round6(remain[c.productKey] - c.wMT));
                    variantCountByKey[c.variantKey] = (variantCountByKey[c.variantKey] || 0) + 1;
                    
                    placedSomething = true;
                    if (slotsLeft <= 0 || weightLeft <= 1e-9) break;
                }
                if (!placedSomething) break;
            }
            
            // Polish: thêm pallet nhẹ nếu còn slot & weight
            polishFillWithLighter(placed, products, remain, slotsLeft, weightLeft);
            
            // Materialize output
            const contOut = materializeContainerOutput(
                containerIndex,
                placed,
                variantMetaByKey,
                container,
                S, // palletsPerLayer
                L  // số tầng stack hiển thị ở item.layer
            );
            // giữ placedRaw cho 3D & recommend
            contOut.__placedRaw = placed.slice();
            
            // 3D (block theo variant, màu theo variant)
            if (action === 'view3D') {
                contOut.coordinates3D = generate3DCoordinates(contOut, container, contOut.__placedRaw, variantMetaByKey, S, L);
            }
            
            assert(contOut.item.length > 0, 'Cannot place any pallet in a new container. Check units or constraints.');
            containers.push(contOut);
        }
        
        // === Khối khuyến nghị (recommend) ===
        const recommendedItems = buildRecommendations(containers, variantMetaByKey, inputData.boxesCutsize || {}, container, S, L);
        
        return { containers, recommendedItems };
    }
    
    // ====================== RECOMMENDATIONS =====================
    
    function buildRecommendations(containers, metaByKey, boxesCutsize, container, S, L) {
        const option1 = [];
        
        if (!containers || containers.length === 0) {
            return { };
        }
        
        // Chọn container có headroom lớn nhất (theo cân nặng)
        let bestIdx = -1, bestHead = 0, bestSlotsLeft = 0;
        for (let i = 0; i < containers.length; i++) {
            const cont = containers[i];
            const placed = cont.__placedRaw || [];
            const { pallets, netMT } = containerMetricsFromPlaced(placed, metaByKey);
            const head = round6(container.maxWeight - netMT);
            const slotsLeft = (S * L) - pallets;
            if (head > 0.0005 && slotsLeft > 0 && head > bestHead) {
                bestIdx = i; bestHead = head; bestSlotsLeft = slotsLeft;
            }
        }
        if (bestIdx < 0) return {  }; // không có headroom phù hợp
        
        const targetCont = containers[bestIdx];
        const placed = targetCont.__placedRaw || [];
        if (!placed.length) return {  };
        
        // Đếm pallet theo variant trong container target
        const cntByVar = {};
        for (const p of placed) {
            cntByVar[p.variantKey] = (cntByVar[p.variantKey] || 0) + 1;
        }
        // Lấy variant chiếm nhiều pallet nhất
        const variantKey = Object.keys(cntByVar).sort((a, b) => cntByVar[b] - cntByVar[a])[0];
        const meta = metaByKey[variantKey];
        if (!meta) return {  };
        
        const wMT = +meta.wMT || 0; // weight per pallet (MT)
        if (wMT <= 0) return {  };
        
        // Số pallet có thể thêm theo slot và weight
        const byWeight = Math.floor((bestHead + 1e-9) / wMT);
        const bySlots = bestSlotsLeft;
        const addPallets = Math.max(0, Math.min(byWeight, bySlots));
        
        if (addPallets <= 0) return {  };
        
        const suggestedQtyMT = round6(addPallets * wMT);
        
        // currentOrder lấy từ boxesCutsize theo productKey (tên product cha)
        const productKey = meta.productKey || meta.parentName || meta.displayName;
        const currentOrderMT = isNum(boxesCutsize[productKey]?.weight) ? +boxesCutsize[productKey].weight : 0;
        const targetWeightMT = round6(currentOrderMT + suggestedQtyMT);
        
        option1.push({
            type: "dedicated",
            action: "increase",
            internalId: meta.internalId ? String(meta.internalId) : "",
            parentID: isNum(meta.parentID) ? meta.parentID : null,
            displayName: meta.parentName || productKey || meta.displayName || "",
            suggestedQty: fixed3(suggestedQtyMT),
            uom: "MT",
            currentOrder: fixed3(currentOrderMT),
            targetWeight: fixed3(targetWeightMT),
            containers: 1,
            loadingType: "single_variant"
        });
        if(option1.length > 0)
            return { option1 };
        return {}
        
    }
    
    function containerMetricsFromPlaced(placed, metaByKey) {
        let pallets = placed.length;
        let net = 0;
        for (const p of placed) {
            const m = metaByKey[p.variantKey];
            net += (p.wMT || (m?.wMT || 0));
        }
        return { pallets, netMT: +(Math.round(net * 1e6) / 1e6) };
    }
    
    // ====================== 3D (contiguous by variant) =====================
    
    function getVariantCounts(placedRaw) {
        const counts = {};
        for (const p of placedRaw) counts[p.variantKey] = (counts[p.variantKey] || 0) + 1;
        return counts;
    }
    function getVariantOrder(variantCounts, metaByKey) {
        return Object.keys(variantCounts).sort((a, b) => {
            const ca = variantCounts[a] || 0;
            const cb = variantCounts[b] || 0;
            if (cb !== ca) return cb - ca; // nhiều trước
            const na = (metaByKey[a]?.displayName || a) + '';
            const nb = (metaByKey[b]?.displayName || b) + '';
            return na.localeCompare(nb);
        });
    }
    function buildVariantColorMapOrder(order) {
        const map = {};
        for (let i = 0; i < order.length; i++) {
            map[order[i]] = COLORS[i % COLORS.length];
        }
        return map;
    }
    
    function generate3DCoordinates(containerOut, containerData, placedRaw, metaByKey, palletsPerLayerS, layersUsed) {
        const coords = [];
        if (!placedRaw || placedRaw.length === 0) return coords;
        
        // Layout sàn (giả định footprint chung)
        const someMeta = metaByKey[placedRaw[0].variantKey];
        const layout = calculateOptimalFloorLayout(someMeta, containerData);
        
        const pprL = layout.palletsPerRowLength; // theo chiều dài
        const pprW = layout.palletsPerRowWidth;  // theo chiều rộng
        const ppl  = layout.palletsPerLayer;     // = palletsPerLayerS
        const aLen = layout.actualLength;
        const aWid = layout.actualWidth;
        
        // Đếm & sắp xếp variant → nhiều pallet trước
        const counts = getVariantCounts(placedRaw);
        const order  = getVariantOrder(counts, metaByKey);
        const variantColors = buildVariantColorMapOrder(order);
        
        let yBase = 0;
        let totalRemain = Object.values(counts).reduce((s, n) => s + n, 0);
        for (let layerIndex = 0; layerIndex < layersUsed && totalRemain > 0; layerIndex++) {
            let indexInLayer = 0; // 0..ppl-1
            let layerMaxH = 0;
            
            for (let oi = 0; oi < order.length && indexInLayer < ppl && totalRemain > 0; oi++) {
                const vKey = order[oi];
                let left = counts[vKey] || 0;
                if (left <= 0) continue;
                const meta = metaByKey[vKey] || {};
                const vH = +meta.height || 0;
                
                const canPut = Math.min(left, ppl - indexInLayer);
                for (let k = 0; k < canPut; k++) {
                    const row = Math.floor(indexInLayer / pprL);
                    const col = indexInLayer % pprL;
                    
                    const x = row * aWid;   // width axis
                    const z = col * aLen;   // length axis
                    const y = yBase;
                    
                    const netKg = (+meta.wMT || 0) * 1000;
                    const approxBoxWeight = Math.round(netKg / 20);
                    
                    coords.push({
                        product: meta.product || (meta.parentName ? (meta.parentName + ' : ' + (meta.displayName || 'Variant')) : (meta.displayName || 'Variant')),
                        internalId: meta.internalId || '',
                        displayName: meta.displayName || 'Variant',
                        position: { x: round2(x), y: round2(y), z: round2(z) },
                        originalDimensions: {
                            width: +meta.width || 0,
                            height: +meta.height || 0,
                            length: +meta.length || 0,
                            weight: approxBoxWeight
                        },
                        packedDimensions: {
                            width: aWid,
                            height: +meta.height || 0,
                            length: aLen
                        },
                        remainingDimensions: {
                            remainingWidth:  fix2(containerData.width  - ((row + 1) * aWid)),
                            remainingHeight: fix2(containerData.height - (y + (+meta.height || 0))),
                            remainingLength: fix2(containerData.length - ((col + 1) * aLen))
                        },
                        color: variantColors[vKey],
                        type: meta.type || "cutsize",
                        productLayer: meta.layer || '',
                        pallet: true
                    });
                    
                    indexInLayer++;
                    layerMaxH = Math.max(layerMaxH, vH);
                }
                counts[vKey] -= canPut;
                totalRemain -= canPut;
            }
            
            if (indexInLayer > 0) yBase += layerMaxH;
        }
        
        return coords;
    }
    
    function calculateOptimalFloorLayout(variantMeta, containerData) {
        const L = +variantMeta.length, W = +variantMeta.width;
        const cL = +containerData.length, cW = +containerData.width;
        
        const n1L = Math.floor(cL / L), n1W = Math.floor(cW / W), cap1 = n1L * n1W;
        const n2L = Math.floor(cL / W), n2W = Math.floor(cW / L), cap2 = n2L * n2W;
        
        if (cap2 > cap1) {
            return {
                palletsPerRowLength: n2L,
                palletsPerRowWidth: n2W,
                palletsPerLayer: cap2,
                actualLength: W,
                actualWidth: L
            };
        }
        return {
            palletsPerRowLength: n1L,
            palletsPerRowWidth: n1W,
            palletsPerLayer: cap1,
            actualLength: L,
            actualWidth: W
        };
    }
    
    // ====================== Materialize to your format =====================
    
    function materializeContainerOutput(containerIndex, placed, metaByKey, container, palletsPerLayerS, layersForOutput) {
        // Group by (productKey::variantKey)
        const grouped = {};
        for (const p of placed) {
            const key = p.productKey + '::' + p.variantKey;
            if (!grouped[key]) grouped[key] = { pallets: 0, netMT: 0, productKey: p.productKey, variantKey: p.variantKey };
            grouped[key].pallets += 1;
            grouped[key].netMT = round6(grouped[key].netMT + p.wMT);
        }
        
        const items = [];
        let totalReams = 0;
        let totalBoxes = 0;
        let totalPallets = 0;
        
        Object.keys(grouped).forEach(k => {
            const g = grouped[k];
            const meta = metaByKey[g.variantKey] || {};
            const reamsPerPallet = toInt(meta.reamsPerPallet || 0);
            const boxesPerPallet = toInt(meta.boxesPerPallet || 0);
            const grossPerPalMT = isNum(meta.grossWeightPerPalletMT) ? +meta.grossWeightPerPalletMT : (meta.wMT || 0);
            const pricePerPallet = isNum(meta.pricePerPallet) ? +meta.pricePerPallet : 0;
            
            const pallets = g.pallets;
            const reams = pallets * reamsPerPallet;
            const boxes = pallets * boxesPerPallet;
            const netMT = round6(g.netMT);
            const grossMT = round6(pallets * grossPerPalMT);
            
            totalReams += reams;
            totalBoxes += boxes;
            totalPallets += pallets;
            
            items.push({
                product: meta.product || (meta.parentName ? (meta.parentName + ' : ' + (meta.displayName || 'Variant')) : (meta.displayName || 'Variant')),
                internalId: meta.internalId ? String(meta.internalId) : '',
                displayName: meta.displayName || 'Variant',
                layer: layersForOutput,                            // số tầng hiển thị
                netWeight: fixed3(netMT),                          // MT
                netWeightKG: fixed3(netMT * 1000),                 // KG
                grossWeight: fixed3(grossMT),                      // MT
                grossWeightKG: fixed3(grossMT * 1000),             // KG
                reams: formatQty(reams, 'RM'),
                boxes: formatQty(boxes, 'CAR'),
                palletsPerContainer: formatQty(pallets, 'PAL'),
                palletsPerLayer: formatQty(palletsPerLayerS, 'PAL'),
                productLayer: meta.layer || '',
                price: pricePerPallet
            });
        });
        
        return {
            containerIndex,
            imgurl,
            containerSize: {
                size: container.size || "40'",
                length: container.length,
                width: container.width,
                height: container.height,
                maxWeight: container.maxWeight
            },
            width: container.width,
            height: container.height,
            length: container.length,
            totalReamsCopyPaper: formatQty(totalReams, 'RM'),
            totalBoxesCopyPaper: formatQty(totalBoxes, 'CAR'),
            totalPalletsCopyPaper: formatQty(totalPallets, 'PAL'),
            item: items
        };
    }
    
    // ============================== BUILDERS ===============================
    
    function buildProductsAndMeta(boxesCutsize, config) {
        const list = [];
        const meta = {}; // variantKey → metadata for output
        
        for (const key in boxesCutsize) {
            const entry = boxesCutsize[key];
            assert(entry && isNum(entry.weight) && Array.isArray(entry.variants), `Invalid boxesCutsize entry: ${key}`);
            
            const variants = entry.variants.map(v => {
                assert(isNum(v.length) && isNum(v.width) && isNum(v.height), `Variant missing footprint (${key})`);
                assert(isNum(v.netWeightPerPallet), `Variant missing netWeightPerPallet (${key})`);
                
                const variantKey = v.internalId ? String(v.internalId) : (v.displayName || JSON.stringify(v));
                const wMT = toMT_fromPerPallet(v, config);
                
                // derive counts if missing
                const derived = deriveCountsFromUOM(v.uomConversionRates);
                const reamsPerPallet = isNum(v.reamsPerPallet) ? +v.reamsPerPallet : derived.reamsPerPallet;
                const boxesPerPallet = isNum(v.boxesPerPallet) ? +v.boxesPerPallet : derived.boxesPerPallet;
                
                // gross MT
                let grossPerPalMT = null;
                if (isNum(v.grossWeightPerPalletMT)) grossPerPalMT = +v.grossWeightPerPalletMT;
                else if (isNum(v.grossWeightPerPallet)) grossPerPalMT = (+v.grossWeightPerPallet) / 1000.0;
                else grossPerPalMT = wMT;
                
                meta[variantKey] = {
                    variantKey,
                    internalId: v.internalId || '',
                    parentID: isNum(v.parentID) ? +v.parentID : null,
                    displayName: v.displayName || variantKey,
                    parentName: v.parentName || key,
                    product: v.product || (v.parentName ? (v.parentName + ' : ' + (v.displayName || 'Variant')) : (key + ' : ' + (v.displayName || 'Variant'))),
                    productKey: key,             // <— để lấy currentOrder từ boxesCutsize
                    layer: v.layer || '',        // "3L"/"4L"
                    palletType: v.palletType || '',
                    reamsPerPallet,
                    boxesPerPallet,
                    grossWeightPerPalletMT: grossPerPalMT,
                    pricePerPallet: isNum(v.pricePerPallet) ? +v.pricePerPallet : 0,
                    wMT,
                    length: +v.length, width: +v.width, height: +v.height
                };
                
                return {
                    productKey: key,
                    variantKey,
                    length: +v.length,
                    width: +v.width,
                    height: +v.height,
                    wMT
                };
            });
            
            // Heavier first helps packing
            variants.sort((a, b) => b.wMT - a.wMT);
            
            list.push({
                productKey: key,
                requiredWeightMT: +entry.weight,
                variants
            });
        }
        return { products: list, variantMetaByKey: meta };
    }
    
    // ============================== HEURISTICS ===============================
    
    function buildCandidates(products, remain) {
        const cands = [];
        for (const p of products) {
            if (remain[p.productKey] <= 1e-9) continue;
            for (const v of p.variants) {
                cands.push({ productKey: p.productKey, variantKey: v.variantKey, wMT: v.wMT });
            }
        }
        return cands;
    }
    
    function scoreAndSortCandidates(cands, remain, targetPerSlot, config) {
        const totalRemain = Object.keys(remain).reduce((s, k) => s + (remain[k] || 0), 0);
        return cands
            .map(c => {
                const need = remain[c.productKey] || 0;
                const gap = Math.abs(c.wMT - targetPerSlot);
                // Giảm ưu tiên cho product có share nhỏ (để container đầu ưu tiên product lớn)
                const share = totalRemain > 0 ? (need / totalRemain) : 0;
                const smallSharePenalty = (share < 0.15) ? (0.15 - share) : 0;
                const heavyBonus = c.wMT;
                return Object.assign({}, c, { _need: need, _gap: gap + smallSharePenalty, _heavy: heavyBonus });
            })
            .sort((a, b) => {
                if (b._need !== a._need) return b._need - a._need;
                if (a._gap !== b._gap) return a._gap - b._gap;
                if (config.preferHeavierFirst) return b._heavy - a._heavy;
                return a._heavy - b._heavy;
            });
    }
    
    function polishFillWithLighter(placed, products, remain, slotsLeft, weightLeft) {
        if (slotsLeft <= 0 || weightLeft <= 1e-9) return;
        
        const light = [];
        for (const p of products) {
            if (remain[p.productKey] <= 1e-9) continue;
            for (const v of p.variants) {
                light.push({ productKey: p.productKey, variantKey: v.variantKey, wMT: v.wMT });
            }
        }
        light.sort((a, b) => a.wMT - b.wMT);
        
        let did = true;
        while (did && slotsLeft > 0 && weightLeft > 1e-9) {
            did = false;
            for (let i = 0; i < light.length; i++) {
                const c = light[i];
                if (remain[c.productKey] <= 1e-9) continue;
                if (c.wMT - 1e-9 > weightLeft) continue;
                
                placed.push({ productKey: c.productKey, variantKey: c.variantKey, wMT: c.wMT });
                slotsLeft--;
                weightLeft = round6(weightLeft - c.wMT);
                remain[c.productKey] = Math.max(0, round6(remain[c.productKey] - c.wMT));
                did = true;
                if (slotsLeft <= 0 || weightLeft <= 1e-9) break;
            }
        }
    }
    
    // ============================== UNITS / UOM ===============================
    
    function toMT_fromPerPallet(v, cfg) {
        // 1) explicit flag
        if (cfg.isKg === true) return (+v.netWeightPerPallet) / 1000;
        
        // 2) baseUnitAbbreviation hint
        if (v.baseUnitAbbreviation) {
            const u = String(v.baseUnitAbbreviation).toLowerCase();
            if (u.includes('kg')) return (+v.netWeightPerPallet) / 1000;
            if (u.includes('ton') || u.includes('mt')) return (+v.netWeightPerPallet);
        }
        
        // 3) heuristic: nếu số lớn (>=100) coi là kg
        const raw = +v.netWeightPerPallet;
        if (raw >= 100) return raw / 1000;
        return raw; // đã là MT
    }
    
    function deriveCountsFromUOM(uom) {
        const out = { reamsPerPallet: 0, boxesPerPallet: 0 };
        if (!uom) return out;
        const palKg = +uom.pallet || 0;
        const reamKg = +uom.ream || 0;
        const cartonKg = +uom.carton || 0;
        if (palKg && reamKg) out.reamsPerPallet = Math.round(palKg / reamKg);
        if (palKg && cartonKg) out.boxesPerPallet = Math.round(palKg / cartonKg);
        return out;
    }
    
    // ============================== UTILS ===============================
    
    function normalizeContainer(c) {
        assert(c && isNum(c.length) && isNum(c.width) && isNum(c.height) && isNum(c.maxWeight), 'Invalid containerSize');
        return {
            size: c.size || '',
            length: +c.length,
            width: +c.width,
            height: +c.height,
            maxWeight: +c.maxWeight // MT
        };
    }
    
    function normalizeConfig(cfg) {
        const def = {
            isKg: true,
            preferHeavierFirst: true,
            maxVariantsPerContainer: null,
            containerStackLayers: 2,
            maxStackLayers: 2,
            strictStackHeightCheck: true
        };
        return Object.assign(def, cfg || {});
    }
    
    function findAnyVariant(products) {
        for (const p of products) if (p.variants.length > 0) return p.variants[0];
        return null;
    }
    
    function computeSlots(container, pallet) {
        const a1 = Math.floor(container.length / pallet.length) * Math.floor(container.width / pallet.width);
        const a2 = Math.floor(container.length / pallet.width) * Math.floor(container.width / pallet.length);
        const S = Math.max(a1, a2);
        assert(S > 0, 'Computed pallet slots is 0. Check units (container vs pallet).');
        return S;
    }
    
    function sumRemain(remain) { let s = 0; for (const k in remain) s += (remain[k] || 0); return s; }
    function sum(arr) { let s = 0; for (const x of arr) s += (+x || 0); return s; }
    
    function formatQty(n, unit) { return `${toInt(n)} ${unit}`; }
    function toInt(x) { return Math.round(+x); }
    function fixed3(x) { return (Math.round((+x) * 1000) / 1000).toFixed(3); }
    function fix2(x) { return (Math.round((+x) * 100) / 100).toFixed(2); }
    function round2(x) { return Math.round((+x) * 100) / 100; }
    
    function isNum(x) { return typeof x === 'number' && !isNaN(x); }
    function assert(cond, msg) { if (!cond) throw new Error(msg); }
    function round6(x) { return Math.round((+x) * 1e6) / 1e6; }
    
    function truncateLog(obj) {
        try {
            const json = JSON.stringify(obj);
            if (json.length <= 4000) return obj;
            return { note: 'result truncated in log', preview: json.substring(0, 4000) + '...' };
        } catch (e) {
            return { note: 'result (non-json)' };
        }
    }
    
    return {
        greedyCalcCutsize
    };
});
