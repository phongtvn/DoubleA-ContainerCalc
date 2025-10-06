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
        
        // Cấp màu tuần tự theo bảng COLORS, xoay vòng khi hết
        const colorMap = Object.create(null);
        let colorIdx = 0;
        
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
                // Lấy/gán màu cho product hiện tại (tuần tự theo COLORS)
                if (!colorMap[key]) {
                    colorMap[key] = COLORS[colorIdx % COLORS.length];
                    colorIdx++;
                }
                const assignedColor = colorMap[key];
                
                meta[variantKey] = {
                    variantKey,
                    internalId: v.internalId || '',
                    displayName: v.displayName || variantKey,
                    parentName: v.parentName || key,
                    parentID:  (v.parentID ?? v.parentId ?? null),
                    product: v.product || (key + ' : ' + (v.displayName || 'Roll')),
                    productKey: key,
                    type: 'roll',
                    
                    diameter_in: mmToIn(diameter_mm),
                    height_in:   mmToIn(width_mm),
                    
                    netPerRollMT,
                    grossPerRollMT,
                    pricePerRoll: 0,
                    color: assignedColor  // <<— cố định theo product
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
        let weightLeft = container.maxWeight;
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
                if (Math.abs((m.diameter_in || 0) - (targetDIn || 0)) > 1e-6) continue;
                cands.push({
                    productKey: p.productKey,
                    variantKey: v.variantKey,
                    wGross: +m.grossPerRollMT || 0,
                    wNet:   +m.netPerRollMT   || 0
                });
            }
            return cands.sort((a,b)=> (b.wGross - a.wGross));
        }
        
        const margin = 0; // chỉnh margin nếu muốn
        
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
                    
                    // === HIGHLIGHT: offset roll đầu tiên sát mép ===
                    const x = margin + (odd ? (honey.dx/2 + honey.r) : honey.r) + k * honey.dx;
                    const z = margin + honey.r + row * honey.dy;
                    const y = 0;
                    
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
        let weightLeft = container.maxWeight;
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
                if (Math.abs((m.diameter_in || 0) - (targetDIn || 0)) > 1e-6) continue;
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
                    
                    // === RESTORED: original grid placement (center-based) ===
                    const x = grid.r + col * grid.dx;
                    const z = grid.r + row * grid.dz;
                    const y = 0;
                    
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
    
    // --- helpers for meta lookups & fallbacks ---
    function getMetaByProductKey(metaByKey, productKey) {
        const arr = [];
        for (const k in metaByKey) {
            const m = metaByKey[k];
            if (m && m.productKey === productKey) arr.push(m);
        }
        return arr;
    }
    function getRepresentativeVariantForProduct(metaByKey, productKey) {
        const arr = getMetaByProductKey(metaByKey, productKey);
        if (!arr.length) return null;
        return arr.find(m => m.parentID != null) || arr[0];
    }
    function findProductKeyByInternalId(internalId, metaByKey) {
        if (!internalId) return null;
        for (const k in metaByKey) {
            const m = metaByKey[k];
            if (String(m.internalId || '') === String(internalId)) return m.productKey || null;
        }
        return null;
    }
    function findParentID(internalId, metaByKey) {
        if (!internalId) return null;
        for (const k in metaByKey) {
            const m = metaByKey[k];
            if (String(m.internalId || '') === String(internalId)) return (m.parentID ?? null);
        }
        return null;
    }
    function findDisplayName(internalId, metaByKey) {
        if (!internalId) return null;
        for (const k in metaByKey) {
            const m = metaByKey[k];
            if (String(m.internalId || '') === String(internalId)) return (m.parentName || m.displayName || null);
        }
        return null;
    }
    
    function findFirstRoll(boxesRoll) {
        for (const k in boxesRoll) {
            const entry = boxesRoll[k];
            if (!entry) continue;
            if (Array.isArray(entry) && entry.length) return entry[0];
            if (Array.isArray(entry?.variants) && entry.variants.length) return entry.variants[0];
        }
        return null;
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
                folder: 17979
            });
            var fileId = fileObj.save();
       //     log.debug('File Saved', 'File ID: ' + fileId);
        } catch (e) {
            // tránh throw để không chặn luồng chính nếu không có quyền File Cabinet
            log.debug('Save file skipped', (e && e.message) || e);
        }
    }
    
    // ====================== 3D COORDS (ROLLS) =====================
    
    // ====================== 3D COORDS (ROLLS) =====================
    
    const COLORS = [
        "0x191970","0x8B0000","0x008000","0xFFA500","0x800080","0xFFFF00","0x00FFFF","0xFF00FF",
        "0xFF4500","0x2E8B57","0x4682B4","0xDAA520","0xADFF2F","0xFF6347","0x9400D3","0xFFD700"
    ];
    function generate3DCoordinatesRolls(containerOut, containerData, placedRaw, metaByKey, honey) {
        const coords = [];
        if (!placedRaw || !placedRaw.length) {
            // vẫn đảm bảo alias top-level cho 3D, để phòng khi không có roll nào
            if (containerOut && containerData) {
                containerOut.width  = containerData.width;
                containerOut.height = containerData.height;
                containerOut.length = containerData.length;
            }
            return coords;
        }
        
        
        for (const p of placedRaw) {
            const m = metaByKey[p.variantKey] || {};
            const d = +m.diameter_in || 0;
            const h = +m.height_in || 0; // roll đứng: height = chiều rộng giấy
            const pos = p.position || { x: 0, y: 0, z: 0 };
            
            const color = m.color || COLORS[0];
            
            coords.push({
                product: m.product || (m.parentName ? (m.parentName + ' : ' + (m.displayName || 'Roll')) : (m.displayName || 'Roll')),
                internalId: m.internalId || '',
                displayName: m.displayName || 'Roll',
                position: { x: +pos.x, y: +pos.y, z: +pos.z },
                // Kích thước gốc & đóng gói
                originalDimensions: { diameter: d, height: h },
                packedDimensions:   { diameter: d, height: h },
                // Alias đúng format script 3D đang đọc
                packedSize: { diameter: d, width: h }, // width = height of standing roll
                // Khoảng trống còn lại (tham khảo)
                remainingDimensions: {
                    remainingWidth:  fix2(containerData.width  - (+pos.x + d/2)),
                    remainingHeight: fix2(containerData.height - (+pos.y + h)),
                    remainingLength: fix2(containerData.length - (+pos.z + d/2))
                },
                color: color,
                type: 'roll'
            });
        }
        
        // === 3D compatibility shim moved here ===
        if (containerOut && containerData) {
            // alias container size to top level (3D expects width/height/length)
            containerOut.width  = containerData.width;
            containerOut.height = containerData.height;
            containerOut.length = containerData.length;
            // keep original summary items
            containerOut.itemSummary = containerOut.item;
            // transform: 3D expects per-piece list in `item`
            containerOut.item = coords;
        }
        
        return coords;
    }
    
    // ====================== RECOMMENDATIONS (ROLLS) =====================
    
    function computeTheoreticalContainerCapacityRoll(metaByKey, container) {
        // Ước lượng capacity (NET, MT) theo từng đường kính đang có.
        // ✅ FIX: trước đây chỉ xét honeycomb ⇒ cho kết quả 20 roll (13.7592 MT) với d≈39.37".
        //    Giờ xét CẢ honeycomb và grid, lấy slots lớn hơn để khớp với pack thực tế (24 roll ≈ 16.511 MT).
        const variants = Object.keys(metaByKey).map(k => metaByKey[k]).filter(m => m.type === 'roll');
        if (!variants.length) return 0;
        const dSet = Array.from(new Set(variants.map(v => +v.diameter_in).filter(Boolean)));
        let best = 0;
        for (const d of dSet) {
            const honey = computeHoneycombCounts(container, d);
            const grid  = computeGridCounts(container, d);
            const slotsHoney = (Math.ceil(honey.rows / 2) * honey.count_even) + (Math.floor(honey.rows / 2) * honey.count_odd);
            const slotsGrid  = (grid.cols * grid.rows);
            const slots      = Math.max(slotsHoney, slotsGrid);
            
            // NET/GROSS per roll (chọn lớn nhất trong nhóm đường kính này)
            const group = variants.filter(v => Math.abs(v.diameter_in - d) < 1e-6);
            const bestNetPerRoll   = Math.max(...group.map(v => +v.netPerRollMT   || 0));
            const bestGrossPerRoll = Math.max(...group.map(v => +v.grossPerRollMT || 0));
            
            // Giới hạn bởi slot (NET) và bởi tải trọng (chuyển tải trọng gross → net qua tỉ lệ net/gross nếu có)
            const capBySlotsNet = slots * bestNetPerRoll;
            let capByWeightNet  = Infinity;
            if (bestGrossPerRoll > 0) {
                const netOverGross = bestNetPerRoll / bestGrossPerRoll; // ~ 0.998 | 0.997...
                capByWeightNet = container.maxWeight * netOverGross;    // chuyển tải trọng gross sang NET tương ứng
            }
            const cap = Math.min(capBySlotsNet, capByWeightNet);
            best = Math.max(best, round6(cap));
        }
        return best;
    }
    
    // === BEGIN: New recommend function (slot-based & whole-roll rounding) ===
    // === BEGIN: New recommend function (slot-based & whole-roll rounding) ===
    function buildRecommendationsRoll(containers, metaByKey, boxesRoll, container, config) {
        if (!containers || !containers.length) return {};
        
        // ----- helpers -----
        function parseRollsCount(str) {
            const n = parseInt(String(str || '').replace(/[^0-9]/g, ''), 10);
            return Number.isFinite(n) ? n : 0;
        }
        function rollsPlacedIn(c) {
            const fromTotal = parseRollsCount(c.totalPalletsRoll);
            if (fromTotal) return fromTotal;
            return (c.item || []).reduce((s, it) => s + parseRollsCount(it.rollsPerContainer), 0);
        }
        function getPerRollNetByProductKey(pKey) {
            for (const k in metaByKey) {
                const m = metaByKey[k];
                if (m && m.productKey === pKey && +m.netPerRollMT > 0) return +m.netPerRollMT;
            }
            return 0;
        }
        function getPerRollNetByInternalId(internalId) {
            if (!internalId) return 0;
            for (const k in metaByKey) {
                const m = metaByKey[k];
                if (String(m.internalId || '') === String(internalId)) return +m.netPerRollMT || 0;
            }
            return 0;
        }
        function roundUpToWholeRolls(netMT, perRollNet) {
            if (!(perRollNet > 0)) return 0;
            const rolls = Math.ceil((netMT - 1e-12) / perRollNet);
            return Math.max(0, round6(rolls * perRollNet));
        }
        function roundNearestWholeRolls(netMT, perRollNet) {
            if (!(perRollNet > 0)) return 0;
            const rolls = Math.round(netMT / perRollNet);
            return Math.max(0, round6(rolls * perRollNet));
        }
        function getOrderQtyForProductLocal(boxes, pKey) {
            const e = boxes && boxes[pKey];
            if (!e) return 0;
            if (typeof e.weight === 'number') return +e.weight || 0;
            const list = Array.isArray(e) ? e : (Array.isArray(e?.variants) ? e.variants : []);
            return list.reduce((s, v) => s + (+v.weight || 0), 0);
        }
        function findItemByProductKeyIn(items, pKey) {
            for (const it of items || []) {
                const pk = findProductKeyByInternalId(it.internalId, metaByKey);
                if (pk === pKey) return it;
            }
            return null;
        }
        
        // ----- totals -----
        const totalOrderMT = Object.keys(boxesRoll || {}).reduce((s, k) => {
            const e = boxesRoll[k];
            if (!e) return s;
            if (typeof e.weight === 'number') return s + (+e.weight || 0);
            if (Array.isArray(e)) return s + e.reduce((ss, v) => ss + (+v.weight || 0), 0);
            if (Array.isArray(e.variants)) return s + e.variants.reduce((ss, v) => ss + (+v.weight || 0), 0);
            return s;
        }, 0);
        if (totalOrderMT <= 0) return {};
        
        const lastContainer = containers[containers.length - 1];
        const lastItems = lastContainer.item || [];
        if (!lastItems.length) return {};
        
        const tolPct = parseFloat(String((config && (config.tolerancePct ?? config.tolerance)) || '').replace('%','')) || 10;
        const THRESHOLD = (100 - tolPct) / 100; // e.g. 0.9
        
        // theoretical (để tính last util cho Case A/B)
        const theoreticalCapacity = computeTheoreticalContainerCapacityRoll(metaByKey, container, config);
        
        // max item (by net) in last
        let maxItem = null, maxW = -1;
        for (const it of lastItems) {
            const w = parseFloat(it.netWeight || 0) || 0;
            if (w > maxW) { maxW = w; maxItem = it; }
        }
        if (!maxItem) return {};
        
        const out = {};
        
        // ================= OPTION 1: INCREASE (điền slot trống) =================
        let missingRollsTotal = 0;
        for (const c of containers) {
            const mode = c.packingMode || 'grid';
            const dIn  = c.diameterUsed || 0;
            const refC = c.containerSize || container;
            if (!(dIn > 0)) continue;
            let maxSlots = 0;
            if (mode === 'grid') {
                const grid = computeGridCounts(refC, dIn);
                maxSlots = grid.cols * grid.rows;
            } else {
                const honey = computeHoneycombCounts(refC, dIn);
                maxSlots = Math.ceil(honey.rows/2) * honey.count_even + Math.floor(honey.rows/2) * honey.count_odd;
            }
            const placed = rollsPlacedIn(c);
            missingRollsTotal += Math.max(0, maxSlots - placed);
        }
        
        if (missingRollsTotal > 0) {
            const repPKey = findProductKeyByInternalId(maxItem.internalId, metaByKey);
            const perRollNet = getPerRollNetByProductKey(repPKey) || getPerRollNetByInternalId(maxItem.internalId);
            if (perRollNet > 0) {
                const suggestedQtyMT = round6(missingRollsTotal * perRollNet);
                out.option1 = [{
                    type: 'dedicated',
                    action: 'increase',
                    internalId: maxItem.internalId || '',
                    parentID: findParentID(maxItem.internalId, metaByKey),
                    displayName: findDisplayName(maxItem.internalId, metaByKey) || 'Roll',
                    suggestedQty: fixed3(suggestedQtyMT), // MT (bội số net/roll)
                    uom: 'MT',
                    currentOrder: fixed3(totalOrderMT),
                    containers: 0,
                    loadingType: 'single_variant'
                }];
            }
        }
        
        // ================= OPTION 2: DECREASE =================
        // Nếu container cuối đã FULL theo số slot, KHÔNG đề xuất decrease
        let lastMaxSlots = 0;
        (function computeLastMaxSlots(){
            const mode = lastContainer.packingMode || 'grid';
            const dIn  = lastContainer.diameterUsed || 0;
            const refC = lastContainer.containerSize || container;
            if (dIn > 0) {
                if (mode === 'grid') {
                    const grid = computeGridCounts(refC, dIn);
                    lastMaxSlots = grid.cols * grid.rows;
                } else {
                    const honey = computeHoneycombCounts(refC, dIn);
                    lastMaxSlots = Math.ceil(honey.rows/2) * honey.count_even + Math.floor(honey.rows/2) * honey.count_odd;
                }
            }
        })();
        const lastPlacedSlots = rollsPlacedIn(lastContainer);
        const lastIsFullBySlots = lastMaxSlots > 0 && lastPlacedSlots >= lastMaxSlots;
        
        if (!lastIsFullBySlots) {
            const totalPackedMT = containers.reduce((s, c) => s + (c.item || []).reduce((ss, it) => ss + (parseFloat(it.netWeight) || 0), 0), 0);
            const lastNet = lastItems.reduce((s, it) => s + (parseFloat(it.netWeight) || 0), 0);
            const lastUtil = theoreticalCapacity > 0 ? (lastNet / theoreticalCapacity) : 0;
            
            const option2 = [];
            
            // ---- Case A: Cont cuối ~ full -> cắt đúng phần dư (làm tròn lên theo roll) ----
            const FULL_UTIL = 0.999;
            if (lastUtil >= FULL_UTIL) {
                const overage = Math.max(0, totalOrderMT - totalPackedMT);
                if (overage > 0.001) {
                    // product trội trong cont cuối
                    const weightByP = {};
                    for (const it of lastItems) {
                        const pKey = findProductKeyByInternalId(it.internalId, metaByKey);
                        if (!pKey) continue;
                        weightByP[pKey] = (weightByP[pKey] || 0) + (parseFloat(it.netWeight) || 0);
                    }
                    let chosenKey = null, best = -1;
                    for (const k in weightByP) if (weightByP[k] > best) { best = weightByP[k]; chosenKey = k; }
                    if (!chosenKey) {
                        const anyKey = Object.keys(metaByKey)[0];
                        chosenKey = anyKey ? (metaByKey[anyKey].productKey || anyKey) : null;
                    }
                    const orderQtyChosen = getOrderQtyForProductLocal(boxesRoll, chosenKey);
                    const perRoll = getPerRollNetByProductKey(chosenKey) || 0;
                    if (perRoll > 0 && orderQtyChosen > 0) {
                        const decMT = roundUpToWholeRolls(overage, perRoll);
                        const clipped = Math.min(orderQtyChosen, decMT);
                        if (clipped > 0.0005) {
                            const rep = findItemByProductKeyIn(lastItems, chosenKey) || maxItem;
                            option2.push({
                                type: 'dedicated',
                                action: 'decrease',
                                internalId: '',
                                parentID: findParentID(rep.internalId, metaByKey),
                                displayName: findDisplayName(rep.internalId, metaByKey) || chosenKey,
                                suggestedQty: fixed3(clipped), // MT (bội số roll)
                                uom: 'MT',
                                currentOrder: fixed3(orderQtyChosen),
                                targetWeight: fixed3(orderQtyChosen - clipped),
                                containers: containers.length,
                                loadingType: 'decrease_to_full_containers'
                            });
                        }
                    }
                }
            }
            // ---- Case B: Cont cuối < threshold & có >=2 containers -> đề xuất bỏ hẳn cont cuối ----
            else if (lastUtil < THRESHOLD && containers.length > 1) {
                const prevByP = {};
                for (let i = 0; i < containers.length - 1; i++) {
                    for (const it of (containers[i].item || [])) {
                        const pKey = findProductKeyByInternalId(it.internalId, metaByKey);
                        if (!pKey) continue;
                        prevByP[pKey] = (prevByP[pKey] || 0) + (parseFloat(it.netWeight) || 0);
                    }
                }
                const seen = new Set();
                for (const it of lastItems) {
                    const pKey = findProductKeyByInternalId(it.internalId, metaByKey);
                    if (!pKey || seen.has(pKey)) continue;
                    seen.add(pKey);
                    const orderQty = getOrderQtyForProductLocal(boxesRoll, pKey);
                    const qtyPrev  = prevByP[pKey] || 0;
                    const reduction = Math.max(0, orderQty - qtyPrev);
                    const perRoll = getPerRollNetByProductKey(pKey) || 0;
                    if (perRoll > 0 && reduction > 0.001) {
                        let decMT = roundNearestWholeRolls(reduction, perRoll);
                        decMT = Math.min(orderQty, decMT);
                        let targetMT = round6(orderQty - decMT);
                        if (Math.abs(targetMT - qtyPrev) <= 0.001) { // snap về qtyPrev nếu rất gần
                            decMT = round6(orderQty - qtyPrev);
                            targetMT = qtyPrev;
                        }
                        option2.push({
                            type: 'dedicated',
                            action: 'decrease',
                            internalId: '',
                            parentID: findParentID(it.internalId, metaByKey),
                            displayName: findDisplayName(it.internalId, metaByKey) || pKey,
                            suggestedQty: fixed3(decMT), // MT (bội số roll)
                            uom: 'MT',
                            currentOrder: fixed3(orderQty),
                            targetWeight: fixed3(targetMT),
                            containers: Math.max(0, containers.length - 1),
                            loadingType: 'per_product_last_container'
                        });
                    }
                }
            }
            
            if (option2.length) out.option2 = option2;
        }
        return out;
    }
    
    function getOrderQtyForProduct(boxesRoll, productKey) {
        const entry = boxesRoll[productKey];
        if (!entry) return 0;
        if (typeof entry.weight === 'number') return +entry.weight || 0;
        if (Array.isArray(entry)) return entry.reduce((s, v) => s + (+v.weight || 0), 0);
        if (Array.isArray(entry.variants)) return entry.variants.reduce((s, v) => s + (+v.weight || 0), 0);
        return 0;
    }

    // ============================== EXPORTS ===============================
    
    return { greedyCalc };
});
