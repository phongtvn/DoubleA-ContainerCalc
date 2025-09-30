/**
 * @NApiVersion 2.1
 */
define(['N/file'], function (file) {
    const imgurl = "https://sca.doubleapaper.com/assets/Container_Image/container.png";


// ============================== ENTRY ===============================
    function greedyCalc(inputData) {
        // Giữ tên hàm cũ để dễ drop-in vào hệ thống của bạn
        try {
            saveFile(inputData, 'input');
            const result = calculateOptimalPackingRoll(inputData);
            saveFile(result, 'result');
            log.debug('Roll (honeycomb) packing result', result);
            return result;
        } catch (error) {
            log.error('Roll (honeycomb) packing error', error);
            return { error: error.message, stack: error.stack };
        }
    }
    
    // ============================== CORE (ROLLS - HONEYCOMB) ===============================
    
    function calculateOptimalPackingRoll(inputData) {
        // 1) Đọc container: ưu tiên binRoll từ roll đầu tiên, fallback containerData/containerSize
        const boxesRoll = inputData.boxesRoll || {};
        const firstRoll = findFirstRoll(boxesRoll);
        assert(firstRoll, 'No roll variants provided');
        
        const containerRaw = firstRoll.binRoll || inputData.containerData || inputData.containerSize;
        assert(containerRaw, 'Missing container (binRoll/containerData/containerSize)');
        const container = normalizeContainer(containerRaw);
        
        const config = normalizeConfig(inputData.config);
        
        // 2) Chuẩn hóa products & meta (roll)
        const { products, variantMetaByKey } = buildRollsAndMeta(boxesRoll, config);
        
        // 3) Remain NET theo product (MT)
        const remain = {};
        for (const p of products) remain[p.productKey] = round6(p.requiredWeightMT);
        
        const containers = [];
        let containerIndex = 0;
        
        while (sumRemain(remain) > 1e-9) {
            // === Chọn đường kính & mode tốt nhất theo các product còn lại ===
            const activeDs = getActiveDiameters(remain, products, variantMetaByKey);
            assert(activeDs.length > 0, 'No active diameters');
            
            let best = null; // {dIn, mode, slots, layout}
            for (const dIn of activeDs) {
                const honey = computeHoneycombCounts(container, dIn);
                const grid  = computeGridCounts(container, dIn);
                if (!((honey.count_even + honey.count_odd) > 0 && honey.rows > 0)) continue;
                if (!(grid.cols > 0 && grid.rows > 0)) continue;
                const honeySlots = Math.ceil(honey.rows / 2) * honey.count_even + Math.floor(honey.rows / 2) * honey.count_odd;
                const gridSlots  = grid.cols * grid.rows;
                const cand1 = { dIn, mode: 'honeycomb', slots: honeySlots, layout: honey };
                const cand2 = { dIn, mode: 'grid',      slots: gridSlots,  layout: grid  };
                for (const c of [cand1, cand2]) {
                    if (!best || c.slots > best.slots) best = c;
                }
            }
            assert(best && best.slots > 0, 'No viable layout for any diameter');
            
            containerIndex++;
            
            let placed;
            if (best.mode === 'grid') {
                placed = packRollsGrid(products, remain, container, variantMetaByKey, best.layout, best.dIn);
            } else {
                placed = packRollsHoneycomb(products, remain, container, variantMetaByKey, best.layout, best.dIn);
            }
            assert(placed.length > 0, 'Cannot place any roll in a new container. Check sizes/constraints.');
            
            const contOut = materializeContainerOutputRolls(containerIndex, placed, variantMetaByKey, container);
            contOut.packingMode = best.mode;
            contOut.diameterUsed = best.dIn;
            if(inputData.action === 'view3D')
                contOut.coordinates3D = generate3DCoordinatesRolls(contOut, container, placed, variantMetaByKey, best.layout);
            
            containers.push(contOut);
            
            // Nếu thiếu còn < 1 roll nhỏ nhất -> dừng (coi như đủ)
            const shortfall = sumRemain(remain);
            const minRollNet = minRollNetWeightRemaining(remain, products, variantMetaByKey);
            if (minRollNet > 0 && shortfall + 1e-9 < minRollNet) break;
        }
        
        // Recommendations
        const recommendedItems = buildRecommendationsRoll(containers, variantMetaByKey, boxesRoll, container, config);
        
        return { containers, recommendedItems };
    }
    
    // ====================== BUILD META (ROLL) =====================
    
    function buildRollsAndMeta(boxesRoll, config) {
        const products = [];
        const meta = {}; // variantKey -> meta
        
        for (const key in boxesRoll) {
            const entry = boxesRoll[key];
            let variants = Array.isArray(entry) ? entry : (entry && Array.isArray(entry.variants) ? entry.variants : []);
            assert(Array.isArray(variants) && variants.length > 0, `Invalid boxesRoll entry: ${key}`);
            // Enforce single-variant per product (business rule)
            if (variants.length > 1) {
                variants = [variants[0]];
            }
            
            // Tổng trọng lượng đặt (MT): ưu tiên entry.weight nếu có; nếu không, cộng dồn field weight trong variants (nếu có)
            let requiredWeightMT = 0;
            if (entry && typeof entry.weight === 'number') {
                requiredWeightMT = +entry.weight;
            } else {
                requiredWeightMT = variants.reduce((s, v) => s + (+v.weight || 0), 0);
            }
            
            const vList = variants.map(v => {
                const variantKey = v.internalId ? String(v.internalId) : (v.displayName || key);
                const diameter_mm = +(v.diameter || 0);   // mm
                const width_mm    = +(v.width_roll || v.width || 0); // mm (chiều rộng giấy)
                assert(diameter_mm > 0 && width_mm > 0, `Missing diameter/width for roll: ${key}`);
                
                // Per-roll weights: ưu tiên *_PerRoll, fallback *_PerPallet
                const netPerRollKG   = +(v.netWeightPerRoll ?? v.netWeightPerPallet ?? 0);
                const grossPerRollKG = +(v.grossWeightPerRoll ?? v.grossWeightPerPallet ?? 0);
                assert(netPerRollKG > 0 && grossPerRollKG > 0, `Missing net/gross per roll for: ${key}`);
                
                const netPerRollMT   = config.isKg ? (netPerRollKG / 1000) : netPerRollKG;
                const grossPerRollMT = config.isKg ? (grossPerRollKG / 1000) : grossPerRollKG;
                
                meta[variantKey] = {
                    variantKey,
                    internalId: v.internalId || '',
                    displayName: v.displayName || variantKey,
                    parentName: v.parentName || key,
                    product: v.product || (key + ' : ' + (v.displayName || 'Roll')),
                    productKey: key,
                    type: 'roll',
                    
                    diameter_in: mmToIn(diameter_mm),
                    height_in:   mmToIn(width_mm),
                    
                    netPerRollMT,
                    grossPerRollMT,
                    pricePerRoll: 0
                };
                
                return { productKey: key, variantKey };
            });
            
            products.push({ productKey: key, requiredWeightMT: round6(requiredWeightMT), variants: vList });
        }
        
        return { products, variantMetaByKey: meta };
    }
    
    // ====================== HONEYCOMB LAYOUT (CIRCLE IN RECT) =====================
    
    function computeHoneycombCounts(container, d) {
        // Xếp theo chiều rộng (W) là số cột; chiều dài (L) là số hàng
        const W = container.width;
        const L = container.length;
        const r = d / 2;
        const dx = d;
        const dy = Math.sqrt(3) / 2 * d;
        
        const count_even = Math.floor(W / d);      // số tâm trên hàng chẵn
        const count_odd  = Math.floor((W - r) / d); // số tâm trên hàng lẻ (dịch nửa đường kính)
        const rows = Math.floor((L - d) / dy) + 1; // số hàng theo chiều dài
        
        return { count_even, count_odd, rows, dx, dy, r };
    }
    
    function packRollsHoneycomb(products, remain, container, metaByKey, honey, targetDIn) {
        let weightLeft = container.maxWeight; // GROSS constraint
        const placed = [];
        
        function buildCandidates() {
            const cands = [];
            for (const p of products) {
                const v = p.variants && p.variants[0]; // single variant enforced
                if (!v) continue;
                if ((remain[p.productKey] || 0) <= 1e-9) continue;
                const m = metaByKey[v.variantKey];
                if (!m) continue;
                if (m.height_in > container.height + 1e-9) continue;
                if (Math.abs((m.diameter_in || 0) - (targetDIn || 0)) > 1e-6) continue; // filter by diameter group
                cands.push({
                    productKey: p.productKey,
                    variantKey: v.variantKey,
                    wGross: +m.grossPerRollMT || 0,
                    wNet:   +m.netPerRollMT   || 0
                });
            }
            return cands.sort((a,b)=> (b.wGross - a.wGross));
        }
        
        for (let row = 0; row < honey.rows && weightLeft > 1e-9; row++) {
            const odd = (row % 2 === 1);
            const nInRow = odd ? honey.count_odd : honey.count_even;
            for (let k = 0; k < nInRow && weightLeft > 1e-9; k++) {
                const candidates = buildCandidates();
                if (!candidates.length) break;
                
                let placedOne = false;
                for (const c of candidates) {
                    if ((remain[c.productKey] || 0) <= 1e-9) continue;
                    if (c.wGross - 1e-9 > weightLeft) continue;
                    
                    const x = (odd ? (honey.r + honey.dx/2) : honey.r) + k * honey.dx;
                    const z = honey.r + row * honey.dy;
                    const y = 0;
                    
                    // Minimize absolute deviation from order NET
                    { const Sp = remain[c.productKey] || 0; if (Math.abs(Sp - c.wNet) > Math.abs(Sp)) continue; }
                    
                    placed.push({ productKey: c.productKey, variantKey: c.variantKey, wMT: c.wGross, position: { x: fix2(x), y: fix2(y), z: fix2(z) } });
                    
                    weightLeft = round6(weightLeft - c.wGross);
                    const newRemain = (remain[c.productKey] || 0) - c.wNet;
                    remain[c.productKey] = newRemain > 0 ? round6(newRemain) : 0;
                    
                    placedOne = true;
                    break;
                }
                if (!placedOne) break;
            }
        }
        
        return placed;
    }
    
    // ====================== GRID LAYOUT (NO HONEYCOMB) =====================
    function computeGridCounts(container, d) {
        const W = container.width;
        const L = container.length;
        const r = d / 2;
        const cols = Math.floor(W / d);
        const rows = Math.floor(L / d);
        return { cols, rows, r, dx: d, dz: d };
    }
    
    function packRollsGrid(products, remain, container, metaByKey, grid, targetDIn) {
        let weightLeft = container.maxWeight; // GROSS constraint
        const placed = [];
        
        function buildCandidates() {
            const cands = [];
            for (const p of products) {
                const v = p.variants && p.variants[0];
                if (!v) continue;
                if ((remain[p.productKey] || 0) <= 1e-9) continue;
                const m = metaByKey[v.variantKey];
                if (!m) continue;
                if (m.height_in > container.height + 1e-9) continue;
                if (Math.abs((m.diameter_in || 0) - (targetDIn || 0)) > 1e-6) continue; // filter by diameter group
                cands.push({ productKey: p.productKey, variantKey: v.variantKey, wGross: +m.grossPerRollMT || 0, wNet: +m.netPerRollMT || 0 });
            }
            return cands.sort((a,b)=> (b.wGross - a.wGross));
        }
        
        for (let row = 0; row < grid.rows && weightLeft > 1e-9; row++) {
            for (let col = 0; col < grid.cols && weightLeft > 1e-9; col++) {
                const candidates = buildCandidates();
                if (!candidates.length) break;
                let placedOne = false;
                for (const c of candidates) {
                    if ((remain[c.productKey] || 0) <= 1e-9) continue;
                    if (c.wGross - 1e-9 > weightLeft) continue;
                    const x = grid.r + col * grid.dx; // theo bề ngang
                    const z = grid.r + row * grid.dz; // theo chiều dài
                    const y = 0;
                    
                    // Minimize absolute deviation from order NET
                    { const Sp = remain[c.productKey] || 0; if (Math.abs(Sp - c.wNet) > Math.abs(Sp)) continue; }
                    
                    placed.push({ productKey: c.productKey, variantKey: c.variantKey, wMT: c.wGross, position: { x: fix2(x), y: fix2(y), z: fix2(z) } });
                    weightLeft = round6(weightLeft - c.wGross);
                    const newRemain = (remain[c.productKey] || 0) - c.wNet;
                    remain[c.productKey] = newRemain > 0 ? round6(newRemain) : 0;
                    placedOne = true;
                    break;
                }
                if (!placedOne) break;
            }
        }
        
        return placed;
    }
    
    // ====================== MATERIALIZE OUTPUT (ROLLS) =====================
    
    function materializeContainerOutputRolls(containerIndex, placed, metaByKey, container) {
        const grouped = {};
        for (const p of placed) {
            const key = p.productKey + '::' + p.variantKey;
            if (!grouped[key]) grouped[key] = { rolls: 0, productKey: p.productKey, variantKey: p.variantKey };
            grouped[key].rolls += 1;
        }
        
        const items = [];
        let totalRolls = 0, totalNet = 0, totalGross = 0;
        
        Object.keys(grouped).forEach(k => {
            const g = grouped[k];
            const m = metaByKey[g.variantKey] || {};
            
            const rolls = g.rolls;
            const net   = rolls * (m.netPerRollMT || 0);
            const gross = rolls * (m.grossPerRollMT || 0);
            
            totalRolls += rolls;
            totalNet   += net;
            totalGross += gross;
            
            items.push({
                product: m.product || (m.parentName ? (m.parentName + ' : ' + (m.displayName || 'Roll')) : (m.displayName || 'Roll')),
                internalId: m.internalId ? String(m.internalId) : '',
                displayName: m.displayName || 'Roll',
                type: 'roll',
                netWeight: fixed3(net),
                netWeightKG: Math.round(net * 1000),
                grossWeight: fixed3(gross),
                grossWeightKG: Math.round(gross * 1000),
                rollsPerContainer: `${rolls} ROL`,
                rollsPerLayer: `${rolls} ROL`, // 1 layer đứng (không chồng), đặt = tổng roll trong cont
                price: 0
            });
        });
        
        return {
            containerIndex,
            containerSize: {
                size: container.size || "40' HQ",
                length: container.length,
                width: container.width,
                height: container.height,
                maxWeight: container.maxWeight
            },
            totalPalletsRoll: `${totalRolls} ROL`,
            item: items
        };
    }
    
    // ============================== UTILS ===============================
    
    function getActiveDiameters(remain, products, metaByKey) {
        const set = new Set();
        for (const p of products) {
            if ((remain[p.productKey] || 0) <= 1e-9) continue;
            const v = p.variants && p.variants[0];
            if (!v) continue;
            const m = metaByKey[v.variantKey];
            if (!m) continue;
            const d = +m.diameter_in;
            if (d > 0) set.add(d);
        }
        return Array.from(set.values());
    }
    
    // ============================== UTILS ===============================
    
    function findFirstRoll(boxesRoll) {
        for (const k in boxesRoll) {
            const entry = boxesRoll[k];
            if (!entry) continue;
            if (Array.isArray(entry) && entry.length) return entry[0];
            if (Array.isArray(entry?.variants) && entry.variants.length) return entry.variants[0];
        }
        return null;
    }
    
    function findAnyVariant(products) {
        for (const p of products) if (p.variants.length > 0) return p.variants[0];
        throw new Error('No variants in products');
    }
    
    function minRollNetWeightRemaining(remain, products, metaByKey) {
        let minVal = Infinity;
        for (const p of products) {
            if ((remain[p.productKey] || 0) <= 1e-9) continue;
            const v = p.variants && p.variants[0];
            if (v) {
                const meta = metaByKey[v.variantKey];
                if (meta) {
                    const mt = meta.netPerRollMT || 0;
                    if (mt > 0) minVal = Math.min(minVal, mt);
                }
            }
        }
        return (minVal === Infinity) ? 0 : minVal;
    }
    
    function normalizeConfig(cfg) {
        const def = {
            isKg: true // net/gross per roll là KG => đổi sang MT
        };
        return Object.assign(def, cfg || {});
    }
    
    function normalizeContainer(c) {
        assert(c && isNum(c.length) && isNum(c.width) && isNum(c.height) && isNum(c.maxWeight), 'Invalid containerSize');
        return { size: c.size || '', length: +c.length, width: +c.width, height: +c.height, maxWeight: +c.maxWeight };
    }
    
    function sumRemain(remain) { let s = 0; for (const k in remain) s += (remain[k] || 0); return s; }
    function fixed3(x) { return (Math.round((+x) * 1000) / 1000).toFixed(3); }
    function fix2(x) { return (Math.round((+x) * 100) / 100).toFixed(2); }
    function round6(x) { return Math.round((+x) * 1e6) / 1e6; }
    function isNum(x) { return typeof x === 'number' && !isNaN(x); }
    function assert(cond, msg) { if (!cond) throw new Error(msg); }
    function mmToIn(mm) { return (+mm) / 25.4; }
    
    function saveFile(result, name) {
        try {
            var fileObj = file.create({
                name: name + '.json',
                fileType: file.Type.JSON,
                contents: JSON.stringify(result),
                folder: 12262
            });
            var fileId = fileObj.save();
            log.debug('File Saved', 'File ID: ' + fileId);
        } catch (e) {
            // tránh throw để không chặn luồng chính nếu không có quyền File Cabinet
            log.debug('Save file skipped', (e && e.message) || e);
        }
    }
    
    // ====================== 3D COORDS (ROLLS) =====================
    
    function generate3DCoordinatesRolls(containerOut, containerData, placedRaw, metaByKey, honey) {
        const coords = [];
        if (!placedRaw || !placedRaw.length) return coords;
        
        for (const p of placedRaw) {
            const m = metaByKey[p.variantKey] || {};
            const d = +m.diameter_in || 0;
            const h = +m.height_in || 0; // roll đứng: height = chiều rộng giấy
            const pos = p.position || { x: 0, y: 0, z: 0 };
            
            coords.push({
                product: m.product || (m.parentName ? (m.parentName + ' : ' + (m.displayName || 'Roll')) : (m.displayName || 'Roll')),
                internalId: m.internalId || '',
                displayName: m.displayName || 'Roll',
                position: { x: +pos.x, y: +pos.y, z: +pos.z },
                originalDimensions: { diameter: d, height: h },
                packedDimensions: { diameter: d, height: h },
                remainingDimensions: {
                    remainingWidth:  fix2(containerData.width  - (+pos.x + d/2)),
                    remainingHeight: fix2(containerData.height - (+pos.y + h)),
                    remainingLength: fix2(containerData.length - (+pos.z + d/2))
                },
                color: undefined,
                type: 'roll'
            });
        }
        return coords;
    }
    
    // ====================== RECOMMENDATIONS (ROLLS) =====================
    
    function computeTheoreticalContainerCapacityRoll(metaByKey, container, config) {
        // Ước lượng theo từng đường kính còn active: lấy max capacity ước lượng
        const variants = Object.keys(metaByKey).map(k => metaByKey[k]).filter(m => m.type === 'roll');
        if (!variants.length) return 0;
        const dSet = Array.from(new Set(variants.map(v => +v.diameter_in).filter(Boolean)));
        let best = 0;
        for (const d of dSet) {
            const honey = computeHoneycombCounts(container, d);
            const slots = Math.ceil(honey.rows / 2) * honey.count_even + Math.floor(honey.rows / 2) * honey.count_odd;
            const bestNetPerRoll = Math.max(...variants.filter(v=> Math.abs(v.diameter_in - d) < 1e-6).map(v => +v.netPerRollMT || 0));
            const capGeom = slots * bestNetPerRoll;
            const capWeight = container.maxWeight;
            best = Math.max(best, round6(Math.min(capGeom, capWeight)));
        }
        return best;
    }
    function buildRecommendationsRoll(containers, metaByKey, boxesRoll, container, config) {
        if (!containers || containers.length === 0) return {};
        
        // Tổng order (NET MT)
        const totalOrderMT = Object.keys(boxesRoll || {}).reduce((s, k) => {
            const entry = boxesRoll[k];
            if (!entry) return s;
            if (typeof entry.weight === 'number') return s + (+entry.weight || 0);
            if (Array.isArray(entry)) return s + entry.reduce((ss, v) => ss + (+v.weight || 0), 0);
            if (Array.isArray(entry.variants)) return s + entry.variants.reduce((ss, v) => ss + (+v.weight || 0), 0);
            return s;
        }, 0);
        if (totalOrderMT <= 0) return {};
        
        // Nếu chỉ có 1 container gần full → không recommend (giống cutsize)
        if (containers.length === 1) {
            const cont = containers[0];
            let actualNet = 0;
            for (const item of cont.item || []) actualNet += parseFloat(item.netWeight || 0);
         //   const theoreticalCap = computeTheoreticalContainerCapacityRoll(metaByKey, container, config);
         //   if (theoreticalCap > 0 && (actualNet / theoreticalCap) > 0.9) return {};
        }
        
        // Container cuối
        const lastContainer = containers[containers.length - 1];
        const lastContainerItems = lastContainer.item || [];
        if (lastContainerItems.length === 0) return {};
        
        // Parse tolerance (%), mặc định 10%
        const tolerancePct = parseFloat(String((config && (config.tolerancePct ?? config.tolerance)) || '').replace('%','')) || 10;
        const utilizationThreshold = (100 - tolerancePct) / 100; // 10% → 0.9
        
        // Tìm item nhiều nhất trong container cuối
        let maxItem = null; let maxWeight = 0;
        for (const item of lastContainerItems) {
            const w = parseFloat(item.netWeight || 0);
            if (w > maxWeight) { maxWeight = w; maxItem = item; }
        }
        if (!maxItem) return {};
        
        // Tính actual capacity của container cuối
        let lastContainerActualNet = 0;
        for (const item of lastContainerItems) lastContainerActualNet += parseFloat(item.netWeight || 0);
        
        // Theoretical capacity cho 1 container (rolls)
        const theoreticalCapacity = computeTheoreticalContainerCapacityRoll(metaByKey, container, config);
        if (!(theoreticalCapacity > 0)) return {};
        
        const out = {};
        
        // Option 1: Mua thêm để full tất cả containers hiện tại
        const currentContainerCount = containers.length;
        const targetOrderWeight = currentContainerCount * theoreticalCapacity;
        const shortfallToOrder = targetOrderWeight - totalOrderMT;
        if (shortfallToOrder >= 0.001) {
            out.option1 = [{
                type: 'dedicated',
                action: 'increase',
                internalId: maxItem.internalId || '',
                parentID: findParentID(maxItem.internalId, metaByKey) || null,
                displayName: findDisplayName(maxItem.internalId, metaByKey) || maxItem.displayName || 'Roll',
                suggestedQty: fixed3(shortfallToOrder), // MT
                uom: 'MT',
                currentOrder: fixed3(totalOrderMT),
                targetWeight: fixed3(targetOrderWeight),
                containers: 0,
                loadingType: 'single_variant'
            }];
        }
        
        // Option 2: Giảm theo 2 case giống cutsize
        const FULL_UTIL = 0.999;   // coi như full nếu >= 99.9%
        const THRESHOLD = utilizationThreshold; // ví dụ 0.9 nếu tolerance 10%
        
        // Tổng packed (NET MT)
        const totalPackedMT = containers.reduce((s, c) => s + (c.item || []).reduce((ss, it) => ss + (parseFloat(it.netWeight) || 0), 0), 0);
        
        const lastNet = lastContainerItems.reduce((s, it) => s + (parseFloat(it.netWeight) || 0), 0);
        const lastUtil = theoreticalCapacity > 0 ? (lastNet / theoreticalCapacity) : 0;
        
        const option2 = [];
        
        // CASE A: Cont cuối ~ full & Order > Packed => giảm đúng phần dư (order - packed)
        if (lastUtil >= FULL_UTIL) {
            const overage = Math.max(0, totalOrderMT - totalPackedMT); // ví dụ 18 - 17.964 = 0.036
            if (overage > 0.001) {
                // chọn product "trội" trong cont cuối
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
                if (!chosenKey) {
                    // fallback an toàn
                    const firstMetaKey = Object.keys(metaByKey)[0];
                    chosenKey = firstMetaKey ? (metaByKey[firstMetaKey].productKey || firstMetaKey) : null;
                }
                
                // Lấy item đại diện để fill các field
                const rep = (lastContainerItems.find(it => findProductKeyByInternalId(it.internalId, metaByKey) === chosenKey) || maxItem || {});
                const orderQtyChosen = getOrderQtyForProduct(boxesRoll, chosenKey);
                const suggest = Math.min(overage, orderQtyChosen);
                
                option2.push({
                    type: 'dedicated',
                    action: 'decrease',
                    internalId: '', // product-level (không gắn variant)
                    parentID: findParentID(rep.internalId, metaByKey) || null,
                    displayName: findDisplayName(rep.internalId, metaByKey) || chosenKey,
                    suggestedQty: fixed3(suggest),              // MT (NET)
                    uom: 'MT',
                    currentOrder: fixed3(orderQtyChosen),
                    targetWeight: fixed3(orderQtyChosen - suggest), // giảm đúng phần dư
                    containers: containers.length,              // giữ nguyên số cont (đều full)
                    loadingType: 'decrease_to_full_containers'
                });
            }
        }
        // CASE B: Cont cuối < threshold & có >=2 containers => đề xuất bỏ hẳn cont cuối (per PRODUCT)
        else if (lastUtil < THRESHOLD && containers.length > 1) {
            // Tính tổng NET theo product ở các cont trước
            const productWeightInPreviousContainers = {};
            for (let i = 0; i < containers.length - 1; i++) {
                for (const it of (containers[i].item || [])) {
                    const pKey = findProductKeyByInternalId(it.internalId, metaByKey);
                    if (!pKey) continue;
                    productWeightInPreviousContainers[pKey] = (productWeightInPreviousContainers[pKey] || 0) + (parseFloat(it.netWeight) || 0);
                }
            }
            
            const processed = new Set();
            for (const it of lastContainerItems) {
                const pKey = findProductKeyByInternalId(it.internalId, metaByKey);
                if (!pKey || processed.has(pKey)) continue;
                processed.add(pKey);
                
                const orderQty = getOrderQtyForProduct(boxesRoll, pKey);
                const qtyPrev  = productWeightInPreviousContainers[pKey] || 0;
                const reductionQty = Math.max(0, orderQty - qtyPrev);
                
                if (reductionQty > 0.001) {
                    option2.push({
                        type: 'dedicated',
                        action: 'decrease',
                        internalId: '', // product-level
                        parentID: findParentID(it.internalId, metaByKey) || null,
                        displayName: findDisplayName(it.internalId, metaByKey) || pKey,
                        suggestedQty: fixed3(reductionQty),       // MT (NET)
                        uom: 'MT',
                        currentOrder: fixed3(orderQty),
                        targetWeight: fixed3(qtyPrev),            // chỉ giữ lượng ở các cont trước
                        containers: Math.max(0, containers.length - 1),
                        loadingType: 'per_product_last_container'
                    });
                }
            }
        }
        
        if (option2.length) out.option2 = option2;
        return out;
    }
    
    
    // ============================== EXPORTS ===============================
    
    return { greedyCalc };
});
