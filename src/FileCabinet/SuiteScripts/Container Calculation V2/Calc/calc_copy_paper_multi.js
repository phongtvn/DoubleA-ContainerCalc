/**
 * @NApiVersion 2.1
 */
define([], function () {
    
    const imgurl = "https://sca.doubleapaper.com/assets/Container_Image/container.png";
    
    // Variant color palette (hex strings) — màu ổn định theo variant
    const COLORS = [
        "0x191970","0x8B0000","0x008000","0xFFA500","0x800080","0xFFFF00","0x00FFFF","0xFF00FF",
        "0xFF4500","0x2E8B57","0x4682B4","0xDAA520","0xADFF2F","0xFF6347","0x9400D3","0xFFD700"
    ];
    
    /**
     * Entry point
     */
    function greedyCalcCutsize(inputData) {
        try {
            const result = calculateOptimalPacking(inputData);
            log.debug('Multi-product container packing result', result);
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
        
        // Slots / tầng (fallback stack toàn cục)
        const S = computeSlots(container, sharedFootprint); // pallet per floor
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
            
            // NEW: nếu phần thiếu < 1 pallet nhỏ nhất → dừng, coi như đã “đủ”
            const shortfall = sumRemain(remain);
            const minPal = minPalletWeightRemaining(remain, products);
            
            // nếu muốn bám tolerance từ input (ví dụ 10%) thì bổ sung điều kiện dưới
          //  const tolPct = parseFloat(String((inputData.tolerance || '')).replace('%','')) || 0;
          //  const totalOrderMT = Object.keys(inputData.boxesCutsize || {}).reduce((s,k)=>s+(+inputData.boxesCutsize[k].weight||0),0);
         //   const withinTolerance = (tolPct > 0) ? (shortfall <= (tolPct/100) * totalOrderMT + 1e-9) : false;
            
            if ((minPal > 0 && shortfall + 1e-9 < minPal)){  // || withinTolerance) {
                break; // không mở cont mới
            }
            
            
            containerIndex++;
            
            // === PACK 1 CONTAINER ===
            let placed = [];
            if (config.enableMixedStackingColumns) {
                placed = packOneContainerByColumns(products, remain, container, S, config, variantMetaByKey);
            } else {
                // Fallback: greedy theo slot & L tầng toàn cục
                let slotsLeft = effectiveSlots;
                let weightLeft = container.maxWeight;
                const totalRemain = sumRemain(remain);
                const t = Math.min(totalRemain / Math.max(1, slotsLeft), container.maxWeight / Math.max(1, slotsLeft));
                let candidates = buildCandidates(products, remain);
                while (slotsLeft > 0 && weightLeft > 1e-9) {
                    candidates = scoreAndSortCandidates(candidates, remain, t, config);
                    let placedSomething = false;
                    for (let i = 0; i < candidates.length; i++) {
                        const c = candidates[i];
                        if (remain[c.productKey] <= 1e-9) continue;
                        if (c.wMT - 1e-9 > weightLeft) continue;
                        placed.push({ productKey: c.productKey, variantKey: c.variantKey, wMT: c.wMT });
                        slotsLeft--;
                        weightLeft = round6(weightLeft - c.wMT);
                        remain[c.productKey] = Math.max(0, round6(remain[c.productKey] - c.wMT));
                        placedSomething = true;
                        if (slotsLeft <= 0 || weightLeft <= 1e-9) break;
                    }
                    if (!placedSomething) break;
                }
                polishFillWithLighter(placed, products, remain, slotsLeft, weightLeft);
            }
            
            // Materialize output
            const contOut = materializeContainerOutput(
                containerIndex, placed, variantMetaByKey, container, S, L
            );
            // giữ placedRaw cho 3D/recommend/polish/rebalance
            contOut.__placedRaw = placed.slice();
            
            if (config.enableMixedStackingColumns) {
                enforceTallPerColumnConstraint(contOut, variantMetaByKey, container, S);
            }
            
            // 3D (block theo variant, màu theo variant)
            // if (action === 'view3D') {
            //     contOut.coordinates3D = generate3DCoordinates(contOut, container, contOut.__placedRaw, variantMetaByKey, S, L);
            // }
            if (action === 'view3D') {
                if (config.enableMixedStackingColumns) {
                    contOut.coordinates3D = generate3DCoordinatesColumnAware(
                        contOut, container, contOut.__placedRaw, variantMetaByKey, S, config
                    );
                } else {
                    contOut.coordinates3D = generate3DCoordinates(
                        contOut, container, contOut.__placedRaw, variantMetaByKey, S, L
                    );
                }
            }
            
            assert(contOut.item.length > 0, 'Cannot place any pallet in a new container. Check units or constraints.');
            containers.push(contOut);
        }
        
        const columnMode = !!config.enableMixedStackingColumns;
        
        if (!columnMode && config.utilizationPolish) {
            for (let i = 0; i < containers.length; i++) {
                tryImproveContainerByOneSwap(containers[i], variantMetaByKey, container, S, L);
            }
        }
        
        if (!columnMode && config.rebalanceAcrossContainers && containers.length > 1) {
            rebalanceAcrossContainers(containers, variantMetaByKey, container, S, L, action);
        }
        
        // Recommendations
      //  const recommendedItems = buildRecommendations(containers, variantMetaByKey, inputData.boxesCutsize || {}, container, S, L);
        const recommendedItems = buildRecommendations(containers, variantMetaByKey, inputData.boxesCutsize || {}, container, S, L, config);
        containers.forEach(cont =>{
            delete cont.__placedRaw
        })
        return { containers, recommendedItems };
    }
    
    // ====================== RECOMMENDATIONS =====================
    function buildRecommendations(containers, metaByKey, boxesCutsize, container, S, L, config) {
        // Tổng order (MT)
        const totalOrderMT = Object.keys(boxesCutsize || {}).reduce((s, k) => s + (+boxesCutsize[k].weight || 0), 0);
        if (totalOrderMT <= 0) return {};
        
        // Sức chứa lý thuyết 1 container (MT) theo mode
        const capPerCont = roundUp3(computeTheoreticalContainerCapacity(metaByKey, container, S, L, config)) ;
        if (!(capPerCont > 0)) return {};
        
        // Số container "cần" theo lý thuyết
        const k = Math.max(1, Math.ceil(totalOrderMT / capPerCont));
        
        // option2: giảm để còn (k-1) container chẵn (nếu k>=2)
        const option2 = [];
        if (k >= 2) {
            const targetDown = (k - 1) * capPerCont;
            
            
            const deltaDown = Math.max(0, totalOrderMT - targetDown);
            
            
            const suggestedDown = roundDown3(deltaDown); // làm tròn xuống 3 số
            
            
            log.debug('capPerCont '+ k, capPerCont)
            log.debug('suggestedDown '+ k, suggestedDown)
            
            if (suggestedDown > 0 && (Math.abs(capPerCont - suggestedDown) > 0.001)) {
                const rep = pickRepresentativeMetaForRecommendation(containers, metaByKey, boxesCutsize);
                option2.push({
                    type: "dedicated",
                    action: "decrease",
                    internalId: rep.internalId ? String(rep.internalId) : "",
                    parentID: isNum(rep.parentID) ? rep.parentID : null,
                    displayName: rep.parentName || rep.productKey || rep.displayName || "",
                    suggestedQty: fixed3(suggestedDown),
                    uom: "MT",
                    currentOrder: fixed3(totalOrderMT),
                    targetWeight: fixed3(Math.max(0, totalOrderMT - suggestedDown)),
                    containers: 1,                 // bỏ bớt 1 container
                    loadingType: "single_variant"  // hiển thị theo product đại diện
                });
            }
        }
        
        // option1: tăng để đạt k container chẵn (fill tới đúng k×capacity)
        const option1 = [];
        const targetUp = k * roundUp3(capPerCont);
        
        
        const deltaUp = Math.max(0, targetUp - totalOrderMT);
        const suggestedUp = roundUp3(deltaUp); // làm tròn lên 3 số
        
        if (suggestedUp > 0) {
            const rep = pickRepresentativeMetaForRecommendation(containers, metaByKey, boxesCutsize);
            option1.push({
                type: "dedicated",
                action: "increase",
                internalId: rep.internalId ? String(rep.internalId) : "",
                parentID: isNum(rep.parentID) ? rep.parentID : null,
                displayName: rep.parentName || rep.productKey || rep.displayName || "",
                suggestedQty: fixed3(suggestedUp),
                uom: "MT",
                currentOrder: fixed3(totalOrderMT),
                targetWeight: fixed3(totalOrderMT + suggestedUp),
                containers: 1,                 // vẫn thêm vào đúng số cont hiện tại để đạt k chẵn
                loadingType: "single_variant"
            });
        }
        
        if (option1.length === 0 && option2.length === 0) return {};
        const out = {};
        if (option1.length) out.option1 = option1;
        if (option2.length) out.option2 = option2;
        return out;
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
    
    // ====================== 3D (contiguous by variant, colored) =====================
    
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
        for (let i = 0; i < order.length; i++) map[order[i]] = COLORS[i % COLORS.length];
        return map;
    }
    function generate3DCoordinatesColumnAware(containerOut, containerData, placedRaw, metaByKey, palletsPerLayerS, config) {
        const coords = [];
        if (!placedRaw || placedRaw.length === 0) return coords;
        
        // Layout sàn (dùng cùng orientation như 2D)
        const someMeta = metaByKey[placedRaw[0].variantKey];
        const layout = calculateOptimalFloorLayout(someMeta, containerData);
        
        const pprL = layout.palletsPerRowLength; // dọc chiều dài
        const pprW = layout.palletsPerRowWidth;  // dọc chiều rộng
        const S    = layout.palletsPerLayer;     // = palletsPerLayerS
        const aLen = layout.actualLength;
        const aWid = layout.actualWidth;
        
        // Map index cột → (row, col), theo đúng thứ tự fill sàn trước đây
        const idxToRC = (idx) => ({ row: Math.floor(idx / pprL), col: (idx % pprL) });
        
        // Màu theo variant (ổn định)
        const counts = getVariantCounts(placedRaw);
        const order  = getVariantOrder(counts, metaByKey);
        const variantColors = buildVariantColorMapOrder(order);
        
        // Column state
        const tallThreshold = containerData.height / 2;
        const maxStacks = (config && config.maxStacksPerColumn) ? config.maxStacksPerColumn : 2;
        const cols = Array.from({ length: S }, () => ({ hUsed: 0, stacks: 0, hasTall: false }));
        
        function findColumnFor(h) {
            let best = -1, bestSlack = Infinity;
            for (let i = 0; i < S; i++) {
                const c = cols[i];
                if (c.stacks >= maxStacks) continue;
                if (c.hUsed + h > containerData.height + 1e-9) continue;
                if (h >= tallThreshold - 1e-9 && c.hasTall) continue; // mỗi cột chỉ 1 pallet "cao"
                const slack = containerData.height - (c.hUsed + h);
                if (slack < bestSlack) { bestSlack = slack; best = i; }
            }
            return best;
        }
        
        for (let idx = 0; idx < placedRaw.length; idx++) {
            const p = placedRaw[idx];
            const m = metaByKey[p.variantKey] || {};
            const h = +m.height || 0;
            
            const colIdx = findColumnFor(h);
            if (colIdx === -1) {
                // không còn cột hợp lệ (an toàn: bỏ qua nếu dữ liệu bất thường)
                continue;
            }
            
            const rc = idxToRC(colIdx);
            const x  = rc.row * aWid;     // width axis
            const z  = rc.col * aLen;     // length axis
            const y  = cols[colIdx].hUsed;
            
            const approxBoxWeight = Math.round((+m.wMT || 0) * 1000 / 20);
            
            coords.push({
                product: m.product || (m.parentName ? (m.parentName + ' : ' + (m.displayName || 'Variant')) : (m.displayName || 'Variant')),
                internalId: m.internalId || '',
                displayName: m.displayName || 'Variant',
                position: { x: round2(x), y: round2(y), z: round2(z) },
                originalDimensions: {
                    width: +m.width || 0,
                    height: +m.height || 0,
                    length: +m.length || 0,
                    weight: approxBoxWeight
                },
                packedDimensions: { width: aWid, height: +m.height || 0, length: aLen },
                remainingDimensions: {
                    remainingWidth:  fix2(containerData.width  - ((rc.row + 1) * aWid)),
                    remainingHeight: fix2(containerData.height - (y + (+m.height || 0))),
                    remainingLength: fix2(containerData.length - ((rc.col + 1) * aLen))
                },
                color: variantColors[p.variantKey],
                type: m.type || "cutsize",
                productLayer: m.layer || '',
                pallet: true
            });
            
            cols[colIdx].hUsed  = round6(cols[colIdx].hUsed + h);
            cols[colIdx].stacks += 1;
            if (h >= tallThreshold - 1e-9) cols[colIdx].hasTall = true;
        }
        
        return coords;
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
                    
                    const x = row * aWid;
                    const z = col * aLen;
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
                        packedDimensions: { width: aWid, height: +meta.height || 0, length: aLen },
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
            return { palletsPerRowLength: n2L, palletsPerRowWidth: n2W, palletsPerLayer: cap2, actualLength: W, actualWidth: L };
        }
        return { palletsPerRowLength: n1L, palletsPerRowWidth: n1W, palletsPerLayer: cap1, actualLength: L, actualWidth: W };
    }
    
    // ====================== Materialize to your format =====================
    
    function materializeContainerOutput(containerIndex, placed, metaByKey, container, palletsPerLayerS, layersForOutput) {
        const grouped = {};
        for (const p of placed) {
            const key = p.productKey + '::' + p.variantKey;
            if (!grouped[key]) grouped[key] = { pallets: 0, netMT: 0, productKey: p.productKey, variantKey: p.variantKey };
            grouped[key].pallets += 1;
            grouped[key].netMT = round6(grouped[key].netMT + p.wMT);
        }
        
        const items = [];
        let totalReams = 0, totalBoxes = 0, totalPallets = 0;
        
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
                layer: layersForOutput,
                netWeight: fixed3(netMT),
                netWeightKG: fixed3(netMT * 1000),
                grossWeight: fixed3(grossMT),
                grossWeightKG: fixed3(grossMT * 1000),
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
                
                const derived = deriveCountsFromUOM(v.uomConversionRates);
                const reamsPerPallet = isNum(v.reamsPerPallet) ? +v.reamsPerPallet : derived.reamsPerPallet;
                const boxesPerPallet = isNum(v.boxesPerPallet) ? +v.boxesPerPallet : derived.boxesPerPallet;
                
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
                    productKey: key,
                    layer: v.layer || '',
                    palletType: v.palletType || '',
                    reamsPerPallet,
                    boxesPerPallet,
                    grossWeightPerPalletMT: grossPerPalMT,
                    pricePerPallet: isNum(v.pricePerPallet) ? +v.pricePerPallet : 0,
                    wMT,
                    length: +v.length, width: +v.width, height: +v.height
                };
                
                return { productKey: key, variantKey, length: +v.length, width: +v.width, height: +v.height, wMT };
            });
            
            variants.sort((a, b) => b.wMT - a.wMT);
            
            list.push({ productKey: key, requiredWeightMT: +entry.weight, variants });
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
    
    // ============================== MIXED COLUMN STACKING ===============================
    
    function packOneContainerByColumns(products, remain, container, S, config, metaByKey) {
        const columns = Array.from({ length: S }, () => ({ hLeft: container.height, count: 0 }));
        let weightLeft = container.maxWeight;
        const placed = [];
        
        function findColumnFor(height) {
            let best = -1, bestSlack = Infinity;
            for (let i = 0; i < columns.length; i++) {
                const col = columns[i];
                if (col.count >= (config.maxStacksPerColumn || 2)) continue;
                if (col.hLeft + 1e-9 < height) continue;
                const slack = col.hLeft - height;
                if (slack < bestSlack) { bestSlack = slack; best = i; }
            }
            return best;
        }
        
        let candidates = buildCandidates(products, remain);
        
        while (weightLeft > 1e-9) {
            const totalRemain = sumRemain(remain);
            const slotsPotential = columns.reduce((s, c) => s + (c.count < (config.maxStacksPerColumn || 2) ? 1 : 0), 0);
            const t = Math.min(
                totalRemain / Math.max(1, slotsPotential),
                container.maxWeight / Math.max(1, slotsPotential)
            );
            candidates = scoreAndSortCandidates(candidates, remain, t, config);
            
            let placedSomething = false;
            for (let i = 0; i < candidates.length; i++) {
                const c = candidates[i];
                if (remain[c.productKey] <= 1e-9) continue;
                if (c.wMT - 1e-9 > weightLeft) continue;
                
                const meta = metaByKey[c.variantKey] || {};
                const h = +meta.height || 0;
                const colIdx = findColumnFor(h);
                if (colIdx === -1) continue;
                
                columns[colIdx].hLeft = round6(columns[colIdx].hLeft - h);
                columns[colIdx].count += 1;
                placed.push({ productKey: c.productKey, variantKey: c.variantKey, wMT: c.wMT });
                weightLeft = round6(weightLeft - c.wMT);
                remain[c.productKey] = Math.max(0, round6(remain[c.productKey] - c.wMT));
                placedSomething = true;
                break;
            }
            
            if (!placedSomething) break;
            
            const minHNeed = minHeightNeededForAny(remain, products, metaByKey);
            const anyColumnHasSpace = columns.some(col => (col.count < (config.maxStacksPerColumn || 2)) && (col.hLeft + 1e-9 >= minHNeed));
            if (!anyColumnHasSpace) break;
        }
        
        return placed;
    }
    
    function minHeightNeededForAny(remain, products, metaByKey) {
        let minH = Infinity;
        for (const p of products) {
            if (remain[p.productKey] <= 1e-9) continue;
            for (const v of p.variants) {
                const m = metaByKey[v.variantKey];
                if (!m) continue;
                minH = Math.min(minH, +m.height || Infinity);
            }
        }
        return (minH === Infinity) ? 1e9 : minH;
    }
    
    // ============================== POLISH & REBALANCE ===============================
    
    function tryImproveContainerByOneSwap(cont, metaByKey, container, S, L) {
        const placed = cont.__placedRaw || [];
        if (!placed.length) return;
        
        const metrics = containerMetricsFromPlaced(placed, metaByKey);
        const headroom = container.maxWeight - metrics.netMT;
        if (headroom <= 1e-6) return;
        
        const placedWithW = placed.map((p, idx) => {
            const w = p.wMT || (metaByKey[p.variantKey]?.wMT || 0);
            return { idx, ...p, w };
        });
        
        let improved = false;
        for (let i = 0; i < placedWithW.length; i++) {
            const cur = placedWithW[i];
            const curW = cur.w;
            const heavier = getHeavierSameProduct(cur.productKey, curW, metaByKey);
            for (const cand of heavier) {
                const delta = cand.wMT - curW;
                if (delta <= 1e-9) continue;
                if (delta <= headroom + 1e-9) {
                    placed[cur.idx] = { productKey: cur.productKey, variantKey: cand.variantKey, wMT: cand.wMT };
                    cont.__placedRaw = placed;
                    improved = true;
                    break;
                }
            }
            if (improved) break;
        }
        
        if (improved) {
            const with3D = !!cont.coordinates3D;
            const rebuilt = rebuildContainerFromPlaced(cont, metaByKey, container, S, L, with3D);
            copyContainerOutputFields(cont, rebuilt);
        }
    }
    
    function getHeavierSameProduct(productKey, curW, metaByKey) {
        const uniq = {};
        for (const k in metaByKey) uniq[k] = metaByKey[k];
        const cands = Object.keys(uniq)
            .map(k => ({ variantKey: k, wMT: uniq[k].wMT || 0 }))
            .filter(x => x.wMT > curW)
            .sort((a,b) => b.wMT - a.wMT);
        return cands;
    }
    
    function rebalanceAcrossContainers(containers, metaByKey, container, S, L, action) {
        if (!containers || containers.length < 2) return;
        
        for (let i = 0; i < containers.length - 1; i++) {
            const contA = containers[i];
            const placedA = contA.__placedRaw || [];
            let metA = containerMetricsFromPlaced(placedA, metaByKey);
            let slotA = (S * L) - metA.pallets;
            let headroomA = container.maxWeight - metA.netMT;
            if (headroomA <= 1e-6) continue;
            
            for (let j = containers.length - 1; j > i && headroomA > 1e-6; j--) {
                const contB = containers[j];
                const placedB = contB.__placedRaw || [];
                if (!placedB.length) continue;
                
                const bWithW = placedB
                    .map((p, idx) => ({ idx, ...p, w: p.wMT || (metaByKey[p.variantKey]?.wMT || 0) }))
                    .sort((a, b) => b.w - a.w);
                
                for (let k = 0; k < bWithW.length && headroomA > 1e-6; k++) {
                    const cand = bWithW[k];
                    if (cand.w <= headroomA + 1e-9 && slotA > 0) {
                        placedB.splice(cand.idx, 1);
                        contB.__placedRaw = placedB;
                        placedA.push({ productKey: cand.productKey, variantKey: cand.variantKey, wMT: cand.w });
                        contA.__placedRaw = placedA;
                        
                        metA.netMT = +(Math.round((metA.netMT + cand.w) * 1e6)/1e6);
                        metA.pallets += 1;
                        slotA -= 1;
                        headroomA = container.maxWeight - metA.netMT;
                        
                        const with3DB = !!contB.coordinates3D;
                        const rebuiltB = rebuildContainerFromPlaced(contB, metaByKey, container, S, L, with3DB);
                        copyContainerOutputFields(contB, rebuiltB);
                    }
                }
            }
            
            const with3DA = !!contA.coordinates3D;
            const rebuiltA = rebuildContainerFromPlaced(contA, metaByKey, container, S, L, with3DA);
            copyContainerOutputFields(contA, rebuiltA);
        }
        
        for (let idx = 0; idx < containers.length; idx++) {
            containers[idx].containerIndex = idx + 1;
            if (action === 'view3D') {
                containers[idx].coordinates3D = generate3DCoordinates(
                    containers[idx], container, containers[idx].__placedRaw || [], metaByKey, S, L
                );
            }
        }
    }
    
    function rebuildContainerFromPlaced(cont, metaByKey, container, S, L, with3D) {
        const rebuilt = materializeContainerOutput(cont.containerIndex, cont.__placedRaw, metaByKey, container, S, L);
        rebuilt.containerIndex = cont.containerIndex;
        if (with3D) {
            rebuilt.coordinates3D = generate3DCoordinates(rebuilt, container, rebuilt.__placedRaw || cont.__placedRaw, metaByKey, S, L);
        }
        rebuilt.__placedRaw = cont.__placedRaw.slice();
        return rebuilt;
    }
    
    function copyContainerOutputFields(dst, src) {
        for (const k in dst) delete dst[k];
        for (const k in src) dst[k] = src[k];
    }
    
    // ============================== UNITS / UOM ===============================
    //tính sức chứa 1 container
    function computeTheoreticalContainerCapacity(metaByKey, container, S, L, config) {
        // Danh sách variant
        const variants = Object.keys(metaByKey).map(k => metaByKey[k]).filter(m => isNum(m.wMT) && isNum(m.height));
        
        if (config && config.enableMixedStackingColumns) {
            // --- Column stacking ---
            const H = container.height;
            const tallTh = H / 2;
            
            let bestPerCol = 0;
            
            // đơn chiếc
            for (const a of variants) {
                if (a.height <= H + 1e-9) bestPerCol = Math.max(bestPerCol, a.wMT);
            }
            // cặp (tối đa 2 pallet/cột, ≤1 tall, tổng cao ≤ H)
            for (let i = 0; i < variants.length; i++) {
                const a = variants[i];
                for (let j = i; j < variants.length; j++) {
                    const b = variants[j];
                    const tallCount = ((a.height >= tallTh - 1e-9) ? 1 : 0) + ((b.height >= tallTh - 1e-9) ? 1 : 0);
                    const hSum = (+a.height) + (+b.height);
                    if (tallCount <= 1 && hSum <= H + 1e-9) {
                        bestPerCol = Math.max(bestPerCol, (+a.wMT) + (+b.wMT));
                    }
                }
            }
            
            const capGeom = S * bestPerCol;               // theo thể tích/chiều cao
            const capWeight = container.maxWeight;        // theo cân nặng
            return round6(Math.min(capGeom, capWeight));  // MT/container
        } else {
            // --- Global L layers ---
            const Hmax = container.height / Math.max(1, L);
            // chọn variant nặng nhất phù hợp chiều cao mỗi tầng
            let heaviest = 0;
            for (const v of variants) if (v.height <= Hmax + 1e-9) heaviest = Math.max(heaviest, v.wMT);
            const capGeom = (S * Math.max(1, L)) * heaviest;
            const capWeight = container.maxWeight;
            return round6(Math.min(capGeom, capWeight));
        }
    }
    //chọn product đại diện để hiển thị recommend
    function pickRepresentativeMetaForRecommendation(containers, metaByKey, boxesCutsize) {
        // ưu tiên: variant có mặt nhiều nhất trong tất cả containers
        const cnt = {};
        (containers || []).forEach(c => (c.__placedRaw || []).forEach(p => {
            cnt[p.variantKey] = (cnt[p.variantKey] || 0) + 1;
        }));
        let bestVar = null, bestCnt = -1;
        for (const k in cnt) if (cnt[k] > bestCnt) { bestCnt = cnt[k]; bestVar = k; }
        if (bestVar && metaByKey[bestVar]) return metaByKey[bestVar];
        
        // fallback: lấy product đầu tiên trong boxesCutsize
        const firstKey = Object.keys(boxesCutsize || {})[0];
        if (firstKey) {
            // tìm variant nặng nhất của product này trong meta
            let pick = null, w = -1;
            for (const k in metaByKey) {
                const m = metaByKey[k];
                if (m.productKey === firstKey && m.wMT > w) { w = m.wMT; pick = m; }
            }
            if (pick) return pick;
        }
        
        // fallback cuối cùng: bất kỳ meta
        const anyK = Object.keys(metaByKey)[0];
        return metaByKey[anyK] || {};
    }
    function enforceTallPerColumnConstraint(contOut, metaByKey, container, S) {
        // "Tall" = pallet có height > H/2 → trong 20’ A4 (4L) = tall
        const placed = contOut.__placedRaw || [];
        const tallThreshold = container.height / 2; // ví dụ 93.9/2 = 46.95
        let tallCount = 0;
        for (const p of placed) {
            const m = metaByKey[p.variantKey] || {};
            const h = +m.height || 0;
            if (h >= (tallThreshold - 1e-9)) tallCount++;
        }
        // Mỗi cột tối đa 1 tall ⇒ tổng tall ≤ số cột S
        assert(tallCount <= S, `Column stacking violation: tall pallets=${tallCount} > columns=${S}.`);
    }
    function toMT_fromPerPallet(v, cfg) {
        if (cfg.isKg === true) return (+v.netWeightPerPallet) / 1000;
        if (v.baseUnitAbbreviation) {
            const u = String(v.baseUnitAbbreviation).toLowerCase();
            if (u.includes('kg')) return (+v.netWeightPerPallet) / 1000;
            if (u.includes('ton') || u.includes('mt')) return (+v.netWeightPerPallet);
        }
        const raw = +v.netWeightPerPallet;
        if (raw >= 100) return raw / 1000;
        return raw;
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
    
    // ============================== DEFAULTS & UTILS ===============================
    
    //xác định pallet nhỏ nhất còn khả dụng
    function minPalletWeightRemaining(remain, products) {
        let m = Infinity;
        for (const p of products) {
            if ((remain[p.productKey] || 0) <= 1e-9) continue;
            for (const v of p.variants) {
                if (v.wMT > 0) m = Math.min(m, v.wMT);
            }
        }
        return (m === Infinity) ? 0 : m;
    }
    // DEFAULTS: bật sẵn mọi tính năng (không cần set trong input)
    function normalizeConfig(cfg) {
        const def = {
            // Đơn vị
            isKg: true,                     // mặc định hiểu net/gross per pallet là KG → đổi sang MT
            
            // Ưu tiên chọn pallet
            preferHeavierFirst: true,
            maxVariantsPerContainer: null,
            
            // Hiển thị (trường 'layer' trong item output)
            containerStackLayers: 1,
            
            // Stack toàn cục (fallback, dùng cho 3D)
            maxStackLayers: 2,
            strictStackHeightCheck: true,
            
            // Dồn sát tải
            utilizationPolish: true,
            rebalanceAcrossContainers: true,
            
            // Xếp theo CỘT (ưu tiên cho 20' & mix 4L+3L)
            enableMixedStackingColumns: true,
            maxStacksPerColumn: 2
        };
        return Object.assign(def, cfg || {});
    }
    
    function normalizeContainer(c) {
        assert(c && isNum(c.length) && isNum(c.width) && isNum(c.height) && isNum(c.maxWeight), 'Invalid containerSize');
        return { size: c.size || '', length: +c.length, width: +c.width, height: +c.height, maxWeight: +c.maxWeight };
    }
    
    function findAnyVariant(products) { for (const p of products) if (p.variants.length > 0) return p.variants[0]; return null; }
    
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
    function roundDown3(x) { return Math.floor((+x + 1e-9) * 1000) / 1000; }
    function roundUp3(x)   { return Math.ceil ((+x - 1e-9) * 1000) / 1000; }
   
    
    // ============================== EXPORTS ===============================
    
    return { greedyCalcCutsize };
});
