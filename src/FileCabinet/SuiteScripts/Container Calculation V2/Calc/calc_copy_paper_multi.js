/**
 * @NApiVersion 2.1
 */
define(['N/file', './calc_copy_paper_recommend'], function (file, recommendation) {
    
    const imgurl = "https://sca.doubleapaper.com/assets/Container_Image/container.png";
    
    // Variant color palette (hex strings) – màu ổn định theo variant
    const COLORS = [
        "0x191970","0x8B0000","0x008000","0xFFA500","0x800080","0xFFFF00","0x00FFFF","0xFF00FF",
        "0xFF4500","0x2E8B57","0x4682B4","0xDAA520","0xADFF2F","0xFF6347","0x9400D3","0xFFD700"
    ];
    
    /**
     * Entry point
     */
    function greedyCalcCutsize(inputData) {
        try {
            
            saveFile(inputData, 'input')
            const result = calculateOptimalPacking(inputData);
            
            saveFile(result, 'result')
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
            const minPal = minPalletWeightRemaining(remain, products, variantMetaByKey);
            
            
            if ((minPal > 0 && shortfall + 1e-9 < minPal)){  // || withinTolerance) {
                break; // không mở cont mới
            }
            
            
            containerIndex++;
            
            // === PACK 1 CONTAINER ===
            let placed = [];
            
            placed = packOneContainerByColumns(products, remain, container, S, config, variantMetaByKey);
            
         
            
            // Materialize output
            const contOut = materializeContainerOutput(
                containerIndex, placed, variantMetaByKey, container, S, L
            );
            // giữ placedRaw cho 3D/recommend/polish/rebalance
            contOut.__placedRaw = placed.slice();
            
            enforceTallPerColumnConstraint(contOut, variantMetaByKey, container, S);
            
            if (action === 'view3D') {
                contOut.coordinates3D = generate3DCoordinates(
                    contOut, container, contOut.__placedRaw, variantMetaByKey, S, config
                );
                
            }
            
            assert(contOut.item.length > 0, 'Cannot place any pallet in a new container. Check units or constraints.');
            containers.push(contOut);
        }
        // Recommendations
        
        const recommendedItems = recommendation.buildRecommendations(containers, variantMetaByKey, inputData.boxesCutsize || {}, container, S, L, config, inputData);
        containers.forEach(cont =>{
            delete cont.__placedRaw
        })
        return { containers, recommendedItems };
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
    function generate3DCoordinates(containerOut, containerData, placedRaw, metaByKey, palletsPerLayerS, config) {
        const coords = [];
        if (!placedRaw || placedRaw.length === 0) return coords;
        
        // Layout sàn (dùng cùng orientation như 2D)
        const someMeta = metaByKey[placedRaw[0].variantKey];
        const layout = calculateOptimalFloorLayout(someMeta, containerData);
        
        const pprW = layout.palletsPerRowWidth;  // dọc chiều rộng
        const S    = layout.palletsPerLayer;     // = palletsPerLayerS
        const aLen = layout.actualLength;
        const aWid = layout.actualWidth;
        
        // Map index cột → (row, col), theo đúng thứ tự fill CHIỀU RỘNG trước
        const idxToRC = (idx) => ({ row: Math.floor(idx / pprW), col: (idx % pprW) });
        
        // Màu theo variant (ổn định)
        const counts = getVariantCounts(placedRaw);
        const order  = getVariantOrder(counts, metaByKey);
        const variantColors = buildVariantColorMapOrder(order);
        
        // Column state
        const tallThreshold = containerData.height / 2;
        const maxStacks = (config && config.maxStacksPerColumn) ? config.maxStacksPerColumn : 2;
        const cols = Array.from({ length: S }, () => ({ hUsed: 0, stacks: 0, hasTall: false }));
        
      
        // chỉ đổi thứ tự lấp cột khi render 3D, không ảnh hưởng số pallet, NET/GROSS, hay các ràng buộc (1 tall/cột, maxStacks…)
        //sửa hàm chọn cột trong bước 3D sang first-fit (cột hợp lệ đầu tiên)
        function findColumnFor(h) {
            for (let i = 0; i < S; i++) {
                const c = cols[i];
                if (c.stacks >= maxStacks) continue;
                if (c.hUsed + h > containerData.height + 1e-9) continue;
                if (h >= tallThreshold - 1e-9 && c.hasTall) continue; // giữ rule 1 tall/cột
                return i; // dùng cột hợp lệ đầu tiên -> fill từ (0,0) ra
            }
            return -1;
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
            const x  = rc.col * aWid;     // col → width axis (tăng nhanh)
            const z  = rc.row * aLen;     // row → length axis (tăng chậm)
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
                    remainingWidth:  fix2(containerData.width  - ((rc.col + 1) * aWid)),
                    remainingHeight: fix2(containerData.height - (y + (+m.height || 0))),
                    remainingLength: fix2(containerData.length - ((rc.row + 1) * aLen))
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
        }
        
        const items = [];
        let totalReams = 0, totalBoxes = 0, totalPallets = 0;
        
        Object.keys(grouped).forEach(k => {
            const g = grouped[k];
            const meta = metaByKey[g.variantKey] || {};
            const reamsPerPallet = toInt(meta.reamsPerPallet || 0);
            const boxesPerPallet = toInt(meta.boxesPerPallet || 0);
            //  const grossPerPalMT = isNum(meta.grossWeightPerPalletMT) ? +meta.grossWeightPerPalletMT : (meta.wMT || 0);
            const pricePerPallet = isNum(meta.pricePerPallet) ? +meta.pricePerPallet : 0;
            
            const pallets = g.pallets;
            const reams = pallets * reamsPerPallet;
            const boxes = pallets * boxesPerPallet;
            const netMT = round6(g.pallets * (meta.netWeightPerPalletMT || 0));   // net thật
            const grossMT = round6(g.pallets * (meta.grossWeightPerPalletMT || 0));   // gross thật
            
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
                
                
                const wMT_Gross = toMT_fromPerPallet_Gross(v, config); // cho constraint
                const wMT_Net = toMT_fromPerPallet_Net(v, config);      // cho display
                
                
                const derived = deriveCountsFromUOM(v.uomConversionRates);
                const reamsPerPallet = isNum(v.reamsPerPallet) ? +v.reamsPerPallet : derived.reamsPerPallet;
                const boxesPerPallet = isNum(v.boxesPerPallet) ? +v.boxesPerPallet : derived.boxesPerPallet;
                
                
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
                    grossWeightPerPalletMT: wMT_Gross,
                    netWeightPerPalletMT: wMT_Net,
                    pricePerPallet: isNum(v.pricePerPallet) ? +v.pricePerPallet : 0,
                    wMT: wMT_Gross,
                    wNetMT: wMT_Net,
                    length: +v.length, width: +v.width, height: +v.height
                };
                
                return { productKey: key, variantKey, length: +v.length, width: +v.width, height: +v.height, wMT: wMT_Gross };
            });
            
            variants.sort((a, b) => b.wMT - a.wMT);
            
            list.push({ productKey: key, requiredWeightMT: +entry.weight, variants });
        }
        return { products: list, variantMetaByKey: meta };
    }
    
    
    // ============================== MIXED COLUMN STACKING ===============================
    function packOneContainerByColumns(products, remain, container, S, config, metaByKey) {
        // Mỗi cột: còn chiều cao (hLeft) và số pallet đã xếp (count)
        const columns = Array.from({ length: S }, () => ({ hLeft: container.height, count: 0 }));
        let weightLeft = container.maxWeight; // *** GROSS constraint ***
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
        
        // Build ứng viên từ remain (NET) và meta (lấy cả gross & net)
        function buildColumnCandidates() {
            const cands = [];
            for (const p of products) {
                if (remain[p.productKey] <= 1e-9) continue; // *** check theo NET còn lại ***
                for (const v of p.variants) {
                    const m = metaByKey[v.variantKey];
                    if (!m) continue;
                    // Bỏ sớm theo chiều cao (nếu đã strictStackHeightCheck ở ngoài)
                    if (m.height > container.height + 1e-9) continue;
                    cands.push({
                        productKey: p.productKey,
                        variantKey: v.variantKey,
                        height: +m.height || 0,
                        wGross: +m.grossWeightPerPalletMT || 0, // dùng cho tải trọng
                        wNet:   +m.netWeightPerPalletMT   || 0  // dùng để trừ remain
                    });
                }
            }
            // Heuristic: ưu tiên pallet nặng (gross) trước để lấp tải trọng tốt hơn,
            // nếu bằng nhau thì pallet cao trước để tận dụng cột 1-tall (nếu có rule 1 tall/column).
            return cands.sort((a, b) => (b.wGross - a.wGross) || (b.height - a.height));
        }
        
        // Vòng xếp theo cột cho đến khi hết tải trọng, hết chỗ, hoặc hết đơn hàng (NET)
        while (weightLeft > 1e-9) {
            // Hết NET cần xếp thì dừng
            let remainTotalNet = 0;
            for (const k in remain) remainTotalNet += (remain[k] || 0);
            if (remainTotalNet <= 1e-9) break;
            
            const candidates = buildColumnCandidates();
            if (!candidates.length) break;
            
            let placedSomething = false;
            
            // Duyệt ứng viên theo thứ tự ưu tiên
            for (let i = 0; i < candidates.length; i++) {
                const c = candidates[i];
                // Nếu sản phẩm này đã hết NET thì bỏ qua
                if ((remain[c.productKey] || 0) <= 1e-9) continue;
                
                // Check tải trọng GROSS
                if (c.wGross - 1e-9 > weightLeft) continue;
                
                // Tìm cột phù hợp về chiều cao & số stack
                const colIdx = findColumnFor(c.height);
                if (colIdx < 0) continue;
                
                // Đặt pallet
                placed.push({ productKey: c.productKey, variantKey: c.variantKey, wMT: c.wGross });
                columns[colIdx].hLeft = +(Math.round((columns[colIdx].hLeft - c.height) * 1e6) / 1e6);
                columns[colIdx].count += 1;
                
                // Giảm tải trọng GROSS của container
                weightLeft = +(Math.round((weightLeft - c.wGross) * 1e6) / 1e6);
                
                // *** Quan trọng: TRỪ remain THEO NET ***
                const newRemain = (remain[c.productKey] || 0) - c.wNet;
                remain[c.productKey] = newRemain > 0 ? +(Math.round(newRemain * 1e6) / 1e6) : 0;
                
                placedSomething = true;
                break; // xếp được 1 pallet rồi thì build lại candidates cho vòng kế tiếp
            }
            
            if (!placedSomething) break;
            
            // Nếu không còn cột nào có thể nhận thêm pallet theo chiều cao/stack → dừng
            let minHNeed = Infinity;
            for (const p of products) {
                if ((remain[p.productKey] || 0) <= 1e-9) continue;
                for (const v of p.variants) {
                    const m = metaByKey[v.variantKey];
                    if (!m) continue;
                    minHNeed = Math.min(minHNeed, +m.height || Infinity);
                }
            }
            const anyColumnHasSpace = columns.some(col =>
                (col.count < (config.maxStacksPerColumn || 2)) && (col.hLeft + 1e-9 >= minHNeed)
            );
            if (!anyColumnHasSpace) break;
        }
        
        return placed;
    }
    

    // ============================== UNITS / UOM ===============================
    
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
        // Mỗi cột tối đa 1 tall → tổng tall ≤ số cột S
        assert(tallCount <= S, `Column stacking violation: tall pallets=${tallCount} > columns=${S}.`);
    }
    function toMT_fromPerPallet_Net(v, cfg) {
        // Luôn trả net weight
        if (cfg.isKg === true) return (+v.netWeightPerPallet) / 1000;
        return (+v.netWeightPerPallet);
    }
    
    function toMT_fromPerPallet_Gross(v, cfg) {
        // Ưu tiên gross, fallback net + pallet weight
        if (v.grossWeightPerPalletMT) return +v.grossWeightPerPalletMT;
        if (v.grossWeightPerPallet) return (+v.grossWeightPerPallet) / 1000;
        
        const netMT = toMT_fromPerPallet_Net(v, cfg);
        return netMT + 0.025; // + ước tính pallet weight
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
    function minPalletWeightRemaining(remain, products, metaByKey) {
        let m = Infinity;
        for (const p of products) {
            if ((remain[p.productKey] || 0) <= 1e-9) continue;
            for (const v of p.variants) {
                const meta = metaByKey[v.variantKey];
                const netWT = meta?.netWeightPerPalletMT || 0;
                if (netWT > 0) m = Math.min(m, netWT);
            }
        }
        return (m === Infinity) ? 0 : m;
    }
    // DEFAULTS: bật sẵn mọi tính năng (không cần set trong input)
    function normalizeConfig(cfg) {
        const def = {
            // Đơn vị
            isKg: true,                     // mặc định hiểu net/gross per pallet là KG → đổi sang MT
            // Stack toàn cục (fallback, dùng cho 3D)
            maxStackLayers: 2,
            strictStackHeightCheck: true,
            maxStacksPerColumn: 3
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
    function formatQty(n, unit) { return `${toInt(n)} ${unit}`; }
    function toInt(x) { return Math.round(+x); }
    function fixed3(x) { return (Math.round((+x) * 1000) / 1000).toFixed(3); }
    function fix2(x) { return (Math.round((+x) * 100) / 100).toFixed(2); }
    function round2(x) { return Math.round((+x) * 100) / 100; }
    
    function isNum(x) { return typeof x === 'number' && !isNaN(x); }
    function assert(cond, msg) { if (!cond) throw new Error(msg); }
    function round6(x) { return Math.round((+x) * 1e6) / 1e6; }
    
    function saveFile(result, name){
        // Save data into file cabinet
        var fileObj3D = file.create({
            name: name + '.json',
            fileType: file.Type.JSON,
            contents: JSON.stringify(result),
            folder: 12262
        });
        fileId3D = fileObj3D.save();
        log.debug('File Saved', 'File ID 3D Input: ' + fileId3D);
    }
    
    // ============================== EXPORTS ===============================
    
    return { greedyCalcCutsize };
});