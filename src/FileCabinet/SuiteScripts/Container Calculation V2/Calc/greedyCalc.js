/**
 * @NApiVersion 2.1
 */
define(['N/file'], function (file) {
    
    const colors = [
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
    
    
    function greedyCalcCutsize(parsedBody) {
        
        
        
        var recommendedBestFitItems = [];
        var containerListCutsize = [];
        var packedBoxesCutsize = [];
        var grandTotalCutsize = 0;
        
        
        var layerCountCutsize = 0;
        var palletsPerLayerCutsize = 0;
        var allRecordCutsize = [];
        var allContainersCutsize = [];
        var boxesCutsize3D = [];
        
        var totalBalanceWeight = 0;
        var totalNetWeightPerPallet = 0;
        var totalPalletsPerContainer = 0;
        var itemRecommendation = false;
        var action = null;
        
        var boxesCutsize = parsedBody.boxesCutsize || [];
        
        
        // container
        var containerData = {length: 232.13, width: 92.52, height: 93.90};
        if (boxesCutsize && typeof boxesCutsize === 'object') {
            var firstKey = Object.keys(boxesCutsize)[0]; // Get the first product name key
            if (firstKey && boxesCutsize[firstKey].length > 0) {
                containerData = boxesCutsize[firstKey][0].containerData || null;
            }
        }
        
        
        function greedyBinPacking(boxesCutsize, containerData) {
            
            var hasCutsize = Object.keys(boxesCutsize).some(function (group) {
                return boxesCutsize[group].some(function (item) {
                    return item.type === "cutsize";
                });
            });
            
            if (hasCutsize) {
                var x = 0, y = 0, z = 0;
                
                // Logic for boxes with different weights
                var leftSideWeight = 0;
                var rightSideWeight = 0;
                var boxesThatFitOnX = [];
                var totalWidth = 0;
                var rowNumber = 0;
                var placeOnLeft = true;
                var occupiedHeights = [];
                var currentBox = null;
                var grandNetWeightPallet = 0;
                var grandNetWeightNewContainer = 0;
                var totalPallets = 0;
                var lowerBound = 0;
                var upperBound = 0;
                var containerFull = false;
                var totalNetWeightPerContainer = 0;
                var totalWeight = 0;
                var InputQty = 0;
                var FCLNetWeight = 0;
                var lastContainerNetWeight = 0;
                var lastContainerFCLNetWeight = 0;
                
                if (Object.keys(boxesCutsize).length > 1) {
                    
                    var balanceWidth = containerData.width;
                    var balanceLength = containerData.length;
                    var balanceHeight = containerData.height;
                    var balanceWeight = containerData.maxWeight * 1000;
                    
                    Object.keys(boxesCutsize).forEach(function (parent) {
                        var items = boxesCutsize[parent];
                        
                        // **Sort items by volume (Largest First)**
                        items.sort(function (a, b) {
                            return (b.width * b.length * b.height) - (a.width * a.length * a.height);
                        });
                        
                        // **Initialize variables for tracking the best optimized box**
                        var bestBox = null;
                        var bestOptimizationScore = null;
                        var containerIndex = 1; // optional: track container number
                        
                        items.forEach(function (box) {
                            if (box.type === 'cutsize') {
                                
                                if (box.baseUnitAbbreviation) {
                                    var baseUnit = box.baseUnitAbbreviation.toLowerCase();
                                    box.weight = (box.weight * box.uomConversionRates[baseUnit]) / box.uomConversionRates.ton;
                                    box.maxWeightTon = box.weight;
                                }
                                
                                // **Step 1: Compute Required Values**
                                var areaOfContainer = balanceWidth * balanceLength;
                                var volumeOfContainer = balanceWidth * balanceLength * balanceHeight;
                                var areaOfPallet = box.width * box.length;
                                var volumeOfPallet = box.width * box.length * box.height;
                                
                                // **Check if Box Fits**
                                if (box.width <= balanceWidth && box.length <= balanceLength && box.height <= balanceHeight) {
                                    var palletsPerLayer = Math.floor((containerData.width * containerData.length) / (box.width * box.length)) || 1;
                                    var palletsPerContainer = Math.floor(box.weight / (box.netWeightPerPallet / 1000)) || 1;
                                    var grossWeight = (box.grossWeightPerPallet / 1000) * palletsPerContainer;
                                    
                                    // **Step 2: Calculate optimization score**
                                    var areaUtilization = areaOfPallet / areaOfContainer;
                                    var volumeUtilization = volumeOfPallet / volumeOfContainer;
                                    var weightUtilization = grossWeight / (containerData.maxWeight || 1);
                                    
                                    var optimizationScore = (areaUtilization) + (volumeUtilization) + (weightUtilization) + (palletsPerLayer);
                                    
                                    // **Step 3: Select the best box**
                                    if (optimizationScore > bestOptimizationScore) {
                                        bestOptimizationScore = optimizationScore;
                                        bestBox = box;
                                    }
                                } else {
                                    log.debug("Skipping box (does not fit)", box.product);
                                }
                            }
                        });
                        
                      //  log.debug('bestbox', bestBox);
                        // **Step 4: Push the selected best box to containerListCutsize**
                        if (bestBox) {
                            
                            var palletsPerLayer = Math.floor((containerData.width * containerData.length) / (bestBox.width * bestBox.length)) || 1;
                            var palletsPerContainer = Math.floor(bestBox.weight / (bestBox.netWeightPerPallet / 1000)) || 1;
                            var palletNetWeight = (bestBox.netWeightPerPallet / 1000) * palletsPerContainer;
                            var netWeight = (bestBox.netWeightPerPallet * palletsPerContainer) / 1000;
                            var grossWeight = (bestBox.grossWeightPerPallet / 1000) * palletsPerContainer;
                            
                            var decimalGrossWeight = palletNetWeight + grossWeight;
                            var weight = Math.floor(decimalGrossWeight - palletNetWeight);
                            var maxLayers = containerData.height / bestBox.height;
                            var noOfPallets = Math.floor(bestBox.weight / (bestBox.netWeightPerPallet / 1000)) || 1;
                            var noOfContainers = noOfPallets / palletsPerContainer || 1;
                            var reamsPerContainer = Math.round(palletsPerContainer * (bestBox.netWeightPerPallet / bestBox.uomConversionRates.ream));
                            var boxesPerContainer = Math.floor((bestBox.weight * 1000) / bestBox.uomConversionRates.box);
                            
                            totalNetWeightPerContainer += netWeight;
                            
                            if (noOfPallets < 1 && totalNetWeightPerContainer > 0) {
                                itemRecommendation = true;
                                
                                totalWeight = 0;
                                palletsPerContainer = (box.weight * 1000) / totalNetWeightPerPallet;
                                noOfPallets = (box.weight * 1000) / totalNetWeightPerPallet;
                                palletsPerLayer = (containerData.width * containerData.length) / (box.width * box.length) || 1;
                                palletNetWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                                grossWeight = (box.grossWeightPerPallet / 1000) * palletsPerContainer;
                                netWeight = (box.netWeightPerPallet * palletsPerContainer) / 1000;
                                maxLayers = containerData.height / box.height;
                                noOfContainers = noOfPallets / palletsPerContainer || 1;
                                decimalGrossWeight = palletNetWeight + grossWeight;
                                weight = decimalGrossWeight - palletNetWeight;
                                reamsPerContainer = palletsPerContainer * (box.netWeightPerPallet / box.uomConversionRates.ream);
                                boxesPerContainer = (weight * 1000) / box.uomConversionRates.box;
                            }
                            
                            if (containerData.size === '20') {
                                if (palletsPerContainer > 24) {
                                    palletsPerContainer = 24;
                                }
                            }
                            
                            if (palletsPerLayer > palletsPerContainer) {
                                palletsPerLayer = palletsPerContainer;
                            }
                            
                            
                            // push summary
                            containerListCutsize.push({
                                parent: parent,
                                parentName: bestBox.parentName,
                                parentID: bestBox.parentID,
                                containerNo: containerIndex, // track which container
                                type: bestBox.type,
                                product: bestBox.product,
                                internalId: bestBox.internalId,
                                displayName: bestBox.displayName,
                                weight: bestBox.weight,
                                maxWeightTon: containerData.maxWeight,
                                grossWeight: grossWeight,
                                netWeight: netWeight,
                                reamsPerContainer: reamsPerContainer,
                                noOfPallets: palletsPerContainer,
                                palletsPerContainer: palletsPerContainer,
                                palletsPerLayer: palletsPerLayer,
                                productLayer: bestBox.layer,
                                boxesPerContainer: boxesPerContainer,
                                recommendedItems: recommendedItems,
                                sortedRecommendedItems: sortedRecommendedItems,
                                totalNetWeightPerPallet: totalNetWeightPerPallet
                            });
                            
                            // push pallets
                            totalPallets = palletsPerContainer;
                            for (var i = 0; i < palletsPerContainer; i++) {
                                boxesCutsize3D.push({
                                    parent: parent,
                                    parentID: bestBox.parentID,
                                    parentName: bestBox.parentName,
                                    containerNo: containerIndex,
                                    documentNo: bestBox.documentNo,
                                    type: bestBox.type,
                                    product: bestBox.product,
                                    internalId: bestBox.internalId,
                                    displayName: bestBox.displayName,
                                    pallet: "true",
                                    layer: bestBox.layer,
                                    length: bestBox.length,
                                    width: bestBox.width,
                                    height: bestBox.height,
                                    weight: bestBox.weight,
                                    maxWeightTon: containerData.maxWeight,
                                    netWeightPerPallet: bestBox.netWeightPerPallet,
                                    grossWeightPerPallet: bestBox.grossWeightPerPallet,
                                    reamsPerContainer: reamsPerContainer,
                                    grossWeight: grossWeight,
                                    netWeight: netWeight,
                                    palletsPerContainer: palletsPerContainer,
                                    palletsPerLayer: palletsPerLayer,
                                    maxLayers: maxLayers,
                                    noOfPallets: palletsPerContainer,
                                    noOfContainers: noOfContainers,
                                    boxesPerContainer: boxesPerContainer,
                                    recommendedItems: recommendedItems,
                                    sortedRecommendedItems: sortedRecommendedItems
                                });
                            }
                            
                            // **Step 5: Update Remaining Space**
                            balanceWidth -= bestBox.width;   // Reduce available width
                            balanceLength -= bestBox.length; // Reduce available length
                            balanceHeight -= bestBox.height; // Reduce available height
                            balanceWeight -= bestBox.netWeightPerPallet; // Reduce weight capacity
                            
                            // Remove selected box from items list
                            items.splice(bestBox, 1);
                            
                        }
                        
                        if (boxesCutsize3D.length > 0) {
                            allRecordCutsize.push(
                                {
                                    boxesCutsize3D: boxesCutsize3D,
                                    containerListCutsize: containerListCutsize
                                });
                        }
                        
                    });
                    
                } else {
                    Object.keys(boxesCutsize).forEach(function (parent) {
                        var items = boxesCutsize[parent];
                        
                        // Sort items by volume (Largest First)
                        items.sort(function (a, b) {
                            return (b.width * b.length * b.height) - (a.width * a.length * a.height);
                        });
                        
                        items.forEach(function (box) {
                            if (box.type === 'cutsize') {
                                totalNetWeightPerPallet += box.netWeightPerPallet;
                             //   log.debug('box.netWeightPerPallet', box.netWeightPerPallet);
                            }
                        });
                        
                        var containerIndex = 1; // optional: track container number
                        var balanceWeight = 0;
                        items.forEach(function (box) {
                            if (box.type === 'cutsize') {
                                
                                InputQty = box.weight;
                                
                                if (box.baseUnitAbbreviation) {
                                    var baseUnit = box.baseUnitAbbreviation.toLowerCase();
                                    box.weight = (box.weight * box.uomConversionRates[baseUnit]) / box.uomConversionRates.ton;
                                }
                                
                                // === perform calculation based on totalProductWeight ===
                                var totalWeight = 0;
                                
                                var palletsPerContainer = Math.floor((box.weight * 1000) / totalNetWeightPerPallet);
                                var tempTotalPallets = totalPalletsPerContainer + palletsPerContainer;
                                
                                if (!containerData.maxWeight || containerData.maxWeight === 0) {
                                    // No max weight defined → assume unlimited
                                    containerData.maxWeight = Infinity;
                                }
                                
                                //
                                // log.debug('totalNetWeightPerPallet', totalNetWeightPerPallet);
                                // log.debug('tempTotalPallets', tempTotalPallets);
                                if (tempTotalPallets <= containerData.maxWeight) {
                                    // ✅ Safe to add
                                    totalPalletsPerContainer = tempTotalPallets;
                                    
                                    var noOfPallets = palletsPerContainer;
                                    var palletsPerLayer = Math.floor((containerData.width * containerData.length) / (box.width * box.length)) || 1;
                                    var palletNetWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                                    var grossWeight = (box.grossWeightPerPallet / 1000) * palletsPerContainer;
                                    var netWeight = (box.netWeightPerPallet * palletsPerContainer) / 1000;
                                    var maxLayers = Math.floor(containerData.height / box.height);
                                    var noOfContainers = noOfPallets / palletsPerContainer || 1;
                                    var decimalGrossWeight = palletNetWeight + grossWeight;
                                    var weight = Math.floor(decimalGrossWeight - palletNetWeight);
                                    var reamsPerContainer = Math.floor(palletsPerContainer * (box.netWeightPerPallet / box.uomConversionRates.ream));
                                    var boxesPerContainer = Math.floor((weight * 1000) / box.uomConversionRates.carton);
                                    
                                    totalNetWeightPerContainer += netWeight;
                                    
                                    if (noOfPallets < 1 && totalNetWeightPerContainer > 0) {
                                        itemRecommendation = true;
                                        
                                        palletsPerContainer = (box.weight * 1000) / totalNetWeightPerPallet;
                                        noOfPallets = palletsPerContainer;
                                        palletsPerLayer = (containerData.width * containerData.length) / (box.width * box.length) || 1;
                                        palletNetWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                                        grossWeight = (box.grossWeightPerPallet / 1000) * palletsPerContainer;
                                        netWeight = (box.netWeightPerPallet * palletsPerContainer) / 1000;
                                        maxLayers = containerData.height / box.height;
                                        noOfContainers = noOfPallets / palletsPerContainer || 1;
                                        decimalGrossWeight = palletNetWeight + grossWeight;
                                        weight = decimalGrossWeight - palletNetWeight;
                                        reamsPerContainer = palletsPerContainer * (box.netWeightPerPallet / box.uomConversionRates.ream);
                                        boxesPerContainer = (weight * 1000) / box.uomConversionRates.carton;
                                    }
                                    
                                    if (palletsPerLayer > palletsPerContainer) {
                                        palletsPerLayer = palletsPerContainer;
                                    }
                                    
                                    var recommendedItems = {};
                                    
                                    // push summary
                                    containerListCutsize.push({
                                        parent: parent,
                                        parentName: box.parentName,
                                        parentID: box.parentID,
                                        containerNo: containerIndex, // track which container
                                        type: box.type,
                                        product: box.product,
                                        internalId: box.internalId,
                                        displayName: box.displayName,
                                        weight: box.weight,
                                        maxWeightTon: containerData.maxWeight,
                                        grossWeight: grossWeight,
                                        netWeight: netWeight,
                                        reamsPerContainer: reamsPerContainer,
                                        noOfPallets: palletsPerContainer,
                                        palletsPerContainer: palletsPerContainer,
                                        palletsPerLayer: palletsPerLayer,
                                        productLayer: box.layer,
                                        boxesPerContainer: boxesPerContainer,
                                        recommendedItems: recommendedItems,
                                        sortedRecommendedItems: sortedRecommendedItems,
                                        totalNetWeightPerPallet: totalNetWeightPerPallet
                                    });
                                    
                                    // push pallets
                                    totalPallets = palletsPerContainer;
                                    for (var i = 0; i < palletsPerContainer; i++) {
                                        boxesCutsize3D.push({
                                            parent: parent,
                                            parentID: box.parentID,
                                            parentName: box.parentName,
                                            containerNo: containerIndex,
                                            documentNo: box.documentNo,
                                            type: box.type,
                                            product: box.product,
                                            internalId: box.internalId,
                                            displayName: box.displayName,
                                            pallet: "true",
                                            layer: box.layer,
                                            length: box.length,
                                            width: box.width,
                                            height: box.height,
                                            weight: box.weight,
                                            maxWeightTon: containerData.maxWeight,
                                            netWeightPerPallet: box.netWeightPerPallet,
                                            grossWeightPerPallet: box.grossWeightPerPallet,
                                            reamsPerContainer: reamsPerContainer,
                                            grossWeight: grossWeight,
                                            netWeight: netWeight,
                                            palletsPerContainer: palletsPerContainer,
                                            palletsPerLayer: palletsPerLayer,
                                            maxLayers: maxLayers,
                                            noOfPallets: palletsPerContainer,
                                            noOfContainers: noOfContainers,
                                            boxesPerContainer: boxesPerContainer,
                                            recommendedItems: recommendedItems,
                                            sortedRecommendedItems: sortedRecommendedItems
                                        });
                                    }
                                    
                                  //  log.debug('palletspercontainer push 1', palletsPerContainer);
                                    if (Number(palletsPerContainer) === Number(containerData.maxWeight)) {
                                        containerFull = true;
                                    }
                                    
                                } else {
                                    
                                //    log.debug('containerFull', containerFull);
                                    if (palletsPerContainer > 0 && containerFull === false) {
                                        // ⚠️ Exceeds maxWeight, reduce box.weight step by step
                                        while (palletsPerContainer > 0 && (totalPalletsPerContainer + palletsPerContainer) > containerData.maxWeight) {
                                            box.weight -= 1; // reduce 1 unit
                                            palletsPerContainer = Math.floor((box.weight * 1000) / totalNetWeightPerPallet);
                                        }
                                        
                                        // ✅ After adjustment, fit into current container
                                        totalPalletsPerContainer += palletsPerContainer;
                                        
                                        // If we reduced weight, calculate balance that should go to next container
                                        balanceWeight = tempTotalPallets - totalPalletsPerContainer;
                                        
                                        var noOfPallets = palletsPerContainer;
                                        var palletsPerLayer = Math.floor((containerData.width * containerData.length) / (box.width * box.length)) || 1;
                                        var palletNetWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                                        var grossWeight = (box.grossWeightPerPallet / 1000) * palletsPerContainer;
                                        var netWeight = (box.netWeightPerPallet * palletsPerContainer) / 1000;
                                        var maxLayers = Math.floor(containerData.height / box.height);
                                        var noOfContainers = noOfPallets / palletsPerContainer || 1;
                                        var decimalGrossWeight = palletNetWeight + grossWeight;
                                        var weight = Math.floor(decimalGrossWeight - palletNetWeight);
                                        var reamsPerContainer = Math.floor(palletsPerContainer * (box.netWeightPerPallet / box.uomConversionRates.ream));
                                        var boxesPerContainer = Math.floor((weight * 1000) / box.uomConversionRates.carton);
                                        
                                        totalNetWeightPerContainer += netWeight;
                                        
                                        if (noOfPallets < 1 && totalNetWeightPerContainer > 0) {
                                            itemRecommendation = true;
                                            
                                            totalWeight = 0;
                                            palletsPerContainer = (box.weight * 1000) / totalNetWeightPerPallet;
                                            noOfPallets = palletsPerContainer;
                                            palletsPerLayer = (containerData.width * containerData.length) / (box.width * box.length) || 1;
                                            palletNetWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                                            grossWeight = (box.grossWeightPerPallet / 1000) * palletsPerContainer;
                                            netWeight = (box.netWeightPerPallet * palletsPerContainer) / 1000;
                                            maxLayers = containerData.height / box.height;
                                            noOfContainers = noOfPallets / palletsPerContainer || 1;
                                            decimalGrossWeight = palletNetWeight + grossWeight;
                                            weight = decimalGrossWeight - palletNetWeight;
                                            reamsPerContainer = palletsPerContainer * (box.netWeightPerPallet / box.uomConversionRates.ream);
                                            boxesPerContainer = (weight * 1000) / box.uomConversionRates.carton;
                                        }
                                        
                                        if (palletsPerLayer > palletsPerContainer) {
                                            palletsPerLayer = palletsPerContainer;
                                        }
                                        
                                        var recommendedItems = {};
                                        
                                        // push summary
                                        containerListCutsize.push({
                                            parent: parent,
                                            parentID: box.parentID,
                                            parentName: box.parentName,
                                            containerNo: containerIndex, // track which container
                                            type: box.type,
                                            product: box.product,
                                            internalId: box.internalId,
                                            displayName: box.displayName,
                                            weight: box.weight,
                                            maxWeightTon: containerData.maxWeight,
                                            grossWeight: grossWeight,
                                            netWeight: netWeight,
                                            reamsPerContainer: reamsPerContainer,
                                            noOfPallets: palletsPerContainer,
                                            palletsPerContainer: palletsPerContainer,
                                            palletsPerLayer: palletsPerLayer,
                                            productLayer: box.layer,
                                            boxesPerContainer: boxesPerContainer,
                                            recommendedItems: recommendedItems,
                                            sortedRecommendedItems: sortedRecommendedItems,
                                            totalNetWeightPerPallet: totalNetWeightPerPallet
                                        });
                                        
                                      //  log.debug('palletspercontainer push 2', palletsPerContainer);
                                        totalPallets = palletsPerContainer;
                                        // push pallets
                                        for (var i = 0; i < palletsPerContainer; i++) {
                                            boxesCutsize3D.push({
                                                parent: parent,
                                                parentID: box.parentID,
                                                parentName: box.parentName,
                                                containerNo: containerIndex,
                                                documentNo: box.documentNo,
                                                type: box.type,
                                                product: box.product,
                                                internalId: box.internalId,
                                                displayName: box.displayName,
                                                pallet: "true",
                                                layer: box.layer,
                                                length: box.length,
                                                width: box.width,
                                                height: box.height,
                                                weight: box.weight,
                                                maxWeightTon: containerData.maxWeight,
                                                netWeightPerPallet: box.netWeightPerPallet,
                                                grossWeightPerPallet: box.grossWeightPerPallet,
                                                reamsPerContainer: reamsPerContainer,
                                                grossWeight: grossWeight,
                                                netWeight: netWeight,
                                                palletsPerContainer: palletsPerContainer,
                                                palletsPerLayer: palletsPerLayer,
                                                maxLayers: maxLayers,
                                                noOfPallets: palletsPerContainer,
                                                noOfContainers: noOfContainers,
                                                boxesPerContainer: boxesPerContainer,
                                                recommendedItems: recommendedItems,
                                                sortedRecommendedItems: sortedRecommendedItems
                                            });
                                        }
                                        
                                    }
                                    
                                    if (balanceWeight > 0 || (palletsPerContainer > 0 && containerFull === true)) {
                                        
                                        allRecordCutsize.push({
                                            boxesCutsize3D: boxesCutsize3D,
                                            containerListCutsize: containerListCutsize
                                        });
                                        
                                        // Create a new box object for the remaining weight
                                        palletsPerContainer = balanceWeight;
                                        containerIndex++;
                                        
                                        var noOfPallets = palletsPerContainer;
                                        var palletsPerLayer = Math.floor((containerData.width * containerData.length) / (box.width * box.length)) || 1;
                                        var palletNetWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                                        var grossWeight = (box.grossWeightPerPallet / 1000) * palletsPerContainer;
                                        var netWeight = (box.netWeightPerPallet * palletsPerContainer) / 1000;
                                        var maxLayers = Math.floor(containerData.height / box.height);
                                        var noOfContainers = noOfPallets / palletsPerContainer || 1;
                                        var decimalGrossWeight = palletNetWeight + grossWeight;
                                        var weight = Math.floor(decimalGrossWeight - palletNetWeight);
                                        var reamsPerContainer = Math.floor(palletsPerContainer * (box.netWeightPerPallet / box.uomConversionRates.ream));
                                        var boxesPerContainer = Math.floor((weight * 1000) / box.uomConversionRates.carton);
                                        
                                        totalNetWeightPerContainer += netWeight;
                                        lastContainerNetWeight = netWeight;
                                        lastContainerFCLNetWeight = (((containerData.maxWeight / items.length) * netWeight) / 1000).toFixed(3);
                                        // log.debug('totalNetWeightPerContainerxxx', totalNetWeightPerContainer);
                                        // log.debug('lastContainerFCLNetWeight', lastContainerFCLNetWeight);
                                        
                                        if (noOfPallets < 1 && totalNetWeightPerContainer > 0) {
                                            itemRecommendation = true;
                                            
                                            totalWeight = 0;
                                            palletsPerContainer = (box.weight * 1000) / totalNetWeightPerPallet;
                                            noOfPallets = palletsPerContainer;
                                            palletsPerLayer = (containerData.width * containerData.length) / (box.width * box.length) || 1;
                                            palletNetWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                                            grossWeight = (box.grossWeightPerPallet / 1000) * palletsPerContainer;
                                            netWeight = (box.netWeightPerPallet * palletsPerContainer) / 1000;
                                            maxLayers = containerData.height / box.height;
                                            noOfContainers = noOfPallets / palletsPerContainer || 1;
                                            decimalGrossWeight = palletNetWeight + grossWeight;
                                            weight = decimalGrossWeight - palletNetWeight;
                                            reamsPerContainer = palletsPerContainer * (box.netWeightPerPallet / box.uomConversionRates.ream);
                                            boxesPerContainer = (weight * 1000) / box.uomConversionRates.carton;
                                        }
                                        
                                        if (palletsPerLayer > palletsPerContainer) {
                                            palletsPerLayer = palletsPerContainer;
                                        }
                                        
                                        var recommendedItems = {};
                                        
                                        // push summary
                                        containerListCutsize.push({
                                            parent: parent,
                                            parentID: box.parentID,
                                            parentName: box.parentName,
                                            containerNo: containerIndex, // track which container
                                            type: box.type,
                                            product: box.product,
                                            internalId: box.internalId,
                                            displayName: box.displayName,
                                            weight: box.weight,
                                            maxWeightTon: containerData.maxWeight,
                                            grossWeight: grossWeight,
                                            netWeight: netWeight,
                                            reamsPerContainer: reamsPerContainer,
                                            noOfPallets: palletsPerContainer,
                                            palletsPerContainer: palletsPerContainer,
                                            palletsPerLayer: palletsPerLayer,
                                            productLayer: box.layer,
                                            boxesPerContainer: boxesPerContainer,
                                            recommendedItems: recommendedItems,
                                            sortedRecommendedItems: sortedRecommendedItems,
                                            totalNetWeightPerPallet: totalNetWeightPerPallet
                                        });
                                        
                                        // push pallets
                                 //       log.debug('palletspercontainer push 3', palletsPerContainer);
                                        grandNetWeightNewContainer = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                                        for (var i = 0; i < palletsPerContainer; i++) {
                                            boxesCutsize3D.push({
                                                parent: parent,
                                                parentID: box.parentID,
                                                parentName: box.parentName,
                                                containerNo: containerIndex,
                                                documentNo: box.documentNo,
                                                type: box.type,
                                                product: box.product,
                                                internalId: box.internalId,
                                                displayName: box.displayName,
                                                pallet: "true",
                                                layer: box.layer,
                                                length: box.length,
                                                width: box.width,
                                                height: box.height,
                                                weight: box.weight,
                                                maxWeightTon: containerData.maxWeight,
                                                netWeightPerPallet: box.netWeightPerPallet,
                                                grossWeightPerPallet: box.grossWeightPerPallet,
                                                reamsPerContainer: reamsPerContainer,
                                                grossWeight: grossWeight,
                                                netWeight: netWeight,
                                                palletsPerContainer: palletsPerContainer,
                                                palletsPerLayer: palletsPerLayer,
                                                maxLayers: maxLayers,
                                                noOfPallets: palletsPerContainer,
                                                noOfContainers: noOfContainers,
                                                boxesPerContainer: boxesPerContainer,
                                                recommendedItems: recommendedItems,
                                                sortedRecommendedItems: sortedRecommendedItems
                                            });
                                        }
                                        
                                    } else {
                                        
                                        allRecordCutsize.push({
                                            boxesCutsize3D: boxesCutsize3D,
                                            containerListCutsize: containerListCutsize
                                        });
                                        
                                        palletsPerContainer = box.weight; // all remaining weight
                                        containerIndex++;
                                        
                                        var noOfPallets = palletsPerContainer;
                                        var palletsPerLayer = Math.floor((containerData.width * containerData.length) / (box.width * box.length)) || 1;
                                        var palletNetWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                                        var grossWeight = (box.grossWeightPerPallet / 1000) * palletsPerContainer;
                                        var netWeight = (box.netWeightPerPallet * palletsPerContainer) / 1000;
                                        var maxLayers = Math.floor(containerData.height / box.height);
                                        var noOfContainers = noOfPallets / palletsPerContainer || 1;
                                        var decimalGrossWeight = palletNetWeight + grossWeight;
                                        var weight = Math.floor(decimalGrossWeight - palletNetWeight);
                                        var reamsPerContainer = Math.floor(palletsPerContainer * (box.netWeightPerPallet / box.uomConversionRates.ream));
                                        var boxesPerContainer = Math.floor((weight * 1000) / box.uomConversionRates.carton);
                                        
                                        
                                        totalNetWeightPerContainer += netWeight;
                                        lastContainerNetWeight = netWeight;
                                        
                                        if (noOfPallets < 1 && totalNetWeightPerContainer > 0) {
                                            itemRecommendation = true;
                                            
                                            palletsPerContainer = (box.weight * 1000) / totalNetWeightPerPallet;
                                            noOfPallets = palletsPerContainer;
                                            palletsPerLayer = (containerData.width * containerData.length) / (box.width * box.length) || 1;
                                            palletNetWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                                            grossWeight = (box.grossWeightPerPallet / 1000) * palletsPerContainer;
                                            netWeight = (box.netWeightPerPallet * palletsPerContainer) / 1000;
                                            maxLayers = containerData.height / box.height;
                                            noOfContainers = noOfPallets / palletsPerContainer || 1;
                                            decimalGrossWeight = palletNetWeight + grossWeight;
                                            weight = decimalGrossWeight - palletNetWeight;
                                            reamsPerContainer = palletsPerContainer * (box.netWeightPerPallet / box.uomConversionRates.ream);
                                            boxesPerContainer = (weight * 1000) / box.uomConversionRates.carton;
                                        }
                                        
                                        if (palletsPerLayer > palletsPerContainer) {
                                            palletsPerLayer = palletsPerContainer;
                                        }
                                        
                                        var recommendedItems = {};
                                        
                                        // push summary
                                        containerListCutsize.push({
                                            parent: parent,
                                            parentID: box.parentID,
                                            parentName: box.parentName,
                                            containerNo: containerIndex, // track which container
                                            type: box.type,
                                            product: box.product,
                                            internalId: box.internalId,
                                            displayName: box.displayName,
                                            weight: box.weight,
                                            maxWeightTon: containerData.maxWeight,
                                            grossWeight: grossWeight,
                                            netWeight: netWeight,
                                            reamsPerContainer: reamsPerContainer,
                                            noOfPallets: palletsPerContainer,
                                            palletsPerContainer: palletsPerContainer,
                                            palletsPerLayer: palletsPerLayer,
                                            productLayer: box.layer,
                                            boxesPerContainer: boxesPerContainer,
                                            recommendedItems: recommendedItems,
                                            sortedRecommendedItems: sortedRecommendedItems,
                                            totalNetWeightPerPallet: totalNetWeightPerPallet
                                        });
                                        
                                        // push pallets
                                        for (var i = 0; i < palletsPerContainer; i++) {
                                            boxesCutsize3D.push({
                                                parent: parent,
                                                parentID: box.parentID,
                                                parentName: box.parentName,
                                                containerNo: containerIndex,
                                                documentNo: box.documentNo,
                                                type: box.type,
                                                product: box.product,
                                                internalId: box.internalId,
                                                displayName: box.displayName,
                                                pallet: "true",
                                                layer: box.layer,
                                                length: box.length,
                                                width: box.width,
                                                height: box.height,
                                                weight: box.weight,
                                                maxWeightTon: containerData.maxWeight,
                                                netWeightPerPallet: box.netWeightPerPallet,
                                                grossWeightPerPallet: box.grossWeightPerPallet,
                                                reamsPerContainer: reamsPerContainer,
                                                grossWeight: grossWeight,
                                                netWeight: netWeight,
                                                palletsPerContainer: palletsPerContainer,
                                                palletsPerLayer: palletsPerLayer,
                                                maxLayers: maxLayers,
                                                noOfPallets: palletsPerContainer,
                                                noOfContainers: noOfContainers,
                                                boxesPerContainer: boxesPerContainer,
                                                recommendedItems: recommendedItems,
                                                sortedRecommendedItems: sortedRecommendedItems
                                            });
                                        }
                                    }
                                }
                                
                                var tol = parseFloat(box.tolerance.replace('%', ''));
                                lowerBound = 100 - tol;
                                upperBound = 100 + tol;
                                
                                grandNetWeightPallet += (box.netWeightPerPallet / 1000) * totalPallets;
                                
                            }
                        });
                        
                     //   log.debug('containerindex', containerIndex);
                        if (containerData.maxWeight !== Infinity) {
                            FCLNetWeight = ((((containerData.maxWeight / items.length) * containerIndex) * totalNetWeightPerPallet) / 1000).toFixed(3);
                        } else {
                            FCLNetWeight = ((((InputQty / items.length) * containerIndex) * totalNetWeightPerPallet) / 1000).toFixed(3);
                        }
                        
                        var minTolerance = FCLNetWeight * (lowerBound / 100);
                        var maxTolerance = FCLNetWeight * (upperBound / 100);
                        
                        // log.debug('items.length', items.length);
                        // log.debug('min tolerance', minTolerance);
                        // log.debug('max tolerance', maxTolerance);
                        // log.debug('InputQty', InputQty);
                        // log.debug('FCLNetWeight', FCLNetWeight);
                        // log.debug('lastcontainernetweight', lastContainerNetWeight);
                        // log.debug('grandNetWeightPallet', grandNetWeightPallet);
                        if (InputQty >= minTolerance && InputQty <= maxTolerance && containerData.maxWeight !== Infinity) {
                            
                            itemRecommendation = true;
                            
                            if (InputQty < FCLNetWeight) {
                                
                               // log.debug('within range & need to add more');
                                action = 'increase';
                                totalBalanceWeight = (FCLNetWeight - InputQty).toFixed(3);
                                
                            } else {
                                
                               // log.debug('within range & need to reduce qty');
                                action = 'reduce';
                                totalBalanceWeight = (InputQty - FCLNetWeight).toFixed(3);
                            }
                            
                        } else if (InputQty < minTolerance) {
                            
                        //    log.debug('add more');
                            action = 'increase';
                            
                            itemRecommendation = true;
                            totalBalanceWeight = (FCLNetWeight - InputQty).toFixed(3);
                            
                        } else if (InputQty >= maxTolerance) {
                            
                            itemRecommendation = true;
                            
                            if (lastContainerNetWeight) {
                                
                             //   log.debug('new container & add more if not yet FCL');
                                action = 'increase';
                                totalBalanceWeight = (FCLNetWeight - lastContainerNetWeight).toFixed(3);
                                
                            } else {
                                
                           //     log.debug('reduce qty');
                                action = 'reduce';
                                if (grandNetWeightPallet) {
                                    totalBalanceWeight = (InputQty - grandNetWeightPallet).toFixed(3);
                                }
                            }
                        }
                        
                     //  log.debug('totalBalanceWeight', totalBalanceWeight);
                        
                        if (boxesCutsize3D.length > 0) {
                            allRecordCutsize.push(
                                {
                                    boxesCutsize3D: boxesCutsize3D,
                                    containerListCutsize: containerListCutsize
                                });
                        }
                        
                    });
                }
                
                var remainingBoxes = null;
                var colorMap = {};
                var totPalletsPerLayer = 0;
                var currentProductCount = 0;
                
             //   log.debug('boxesCutsize3D.length', boxesCutsize3D.length);
                boxesCutsize3D.forEach(function (box, boxIndex) {
                    
                    if (box.type == 'cutsize') {
                        
                        // 3D Start
                        // var currentLayerColor = colors[layerCountCutsize % colors.length];
                        
                        // Assign a unique color per item
                        if (!colorMap[box.product]) {
                            colorMap[box.product] = colors[Object.keys(colorMap).length % colors.length];
                        }
                        var currentItemColor = colorMap[box.product]; // Get the color for the current item
                        
                        var rotations = generateLogicalRotations(box);
                        var bestFitRotation = null;
                        
                        // Set the initial benchmark using the first box rotation
                        var firstRotation = rotations[0];
                        var initialRemainingDimensions = {
                            remainingLength: containerData.length - z,
                            remainingWidth: containerData.width - x,
                            remainingHeight: containerData.height - y
                        };
                        
                        
                        // Initialize the best fit with the first rotation
                        if (canFit(initialRemainingDimensions, firstRotation)) {
                            bestFitRotation = firstRotation; // Set the first rotation as the initial best fit
                        }
                        
                        // Define current position for each box before checking its fit
                        var currentPosition = {
                            remainingLength: containerData.length - z,
                            remainingWidth: containerData.width - totalWidth,
                            remainingHeight: containerData.height - y
                        };
                        
                        // Variables to hold the best fits
                        var bestFitWithShorterWidth = null;
                        var bestFitWithLongerWidth = null;
                        
                        // Check each box rotation for fit
                        rotations.forEach(function (rotatedBox) {
                            // Check if the current rotation can fit
                            if (canFit(currentPosition, rotatedBox)) {
                                
                                remainingBoxes = boxesCutsize3D.slice(boxIndex + 1);
                                var isLastBox = remainingBoxes.length === 0;
                                
                                // Prioritize boxes with LONGER WIDTH than LENGTH
                                if (rotatedBox.width > rotatedBox.length && totalWidth + rotatedBox.width <= containerData.width) {
                                    if (!bestFitWithLongerWidth || rotatedBox.weight < bestFitWithLongerWidth.weight) {
                                        bestFitWithLongerWidth = rotatedBox;
                                    }
                                }
                                // Otherwise, consider using a shorter width for the last box scenario
                                else if (totalWidth + rotatedBox.length <= containerData.width) {
                                    if (!bestFitWithShorterWidth || rotatedBox.weight < bestFitWithShorterWidth.weight) {
                                        bestFitWithShorterWidth = rotatedBox;
                                    }
                                }
                            }
                        });
                        
                        // Add the best fit to boxes that fit on x-axis
                        if (bestFitWithLongerWidth) {
                            boxesThatFitOnX.push(bestFitWithLongerWidth);
                            totalWidth += bestFitWithLongerWidth.length;
                        } else if (bestFitWithShorterWidth) {
                            // Add longer width box if no shorter width box fits
                            boxesThatFitOnX.push(bestFitWithShorterWidth);
                            totalWidth += bestFitWithShorterWidth.width;
                        }
                        
                        if (boxesThatFitOnX.length > 0) {
                            bestFitRotation = boxesThatFitOnX[0];
                        }
                        
                        // Distribute boxes along the x-axis row by alternating placement between front and back sides
                        boxesThatFitOnX.forEach(function (fittedBox, index) {
                            // Determine if we are on an even or odd row (rowNumber tracks rows)
                            var isEvenRow = rowNumber % 2 === 0; // Even rows start from front (left), odd rows from back (right)
                            
                            // Alternate between front and back placement
                            var placeOnFront = (isEvenRow && placeOnLeft) || (!isEvenRow && !placeOnLeft);
                            var sideToPlace = placeOnFront ? 'left' : 'right';
                            
                            // Update weight distribution based on side
                            if (sideToPlace === 'left') {
                                leftSideWeight += fittedBox.weight;
                            } else {
                                rightSideWeight += fittedBox.weight;
                            }
                        });
                        
                        totalWidth = 0;
                        rowNumber++;
                        placeOnLeft = !placeOnLeft;
                        boxesThatFitOnX = [];
                        var heightMap = {};
                        
                        // After finding the best fit, check if it can be placed
                        if (bestFitRotation) {
                            
                            var positionKey = x + "," + z;
                            if (!occupiedHeights[positionKey]) {
                                occupiedHeights[positionKey] = 0;
                            }
                            
                            var occupiedHeightAtPosition = occupiedHeights[positionKey];
                            
                            if (occupiedHeightAtPosition + bestFitRotation.height <= containerData.height) {
                                palletsPerLayerCutsize++;
                                
                                if (!heightMap[positionKey]) {
                                    heightMap[positionKey] = occupiedHeightAtPosition + bestFitRotation.height;
                                } else {
                                    heightMap[positionKey] = Math.max(heightMap[positionKey], occupiedHeightAtPosition + bestFitRotation.height);
                                }
                                
                                var minOccupiedHeight = Math.min.apply(null, Object.values(heightMap)) || 0;
                                var remainingHeight = containerData.height - minOccupiedHeight;
                                
                                totPalletsPerLayer++;
                                
                                packedBoxesCutsize.push({
                                    x: x,
                                    y: occupiedHeightAtPosition,
                                    z: z,
                                    originalDimensions: box,
                                    box: bestFitRotation,
                                    color: currentItemColor,
                                    remainingDimensions: {
                                        remainingLength: containerData.length - z,
                                        remainingWidth: containerData.width - x,
                                        remainingHeight: remainingHeight
                                    },
                                    type: box.type,
                                    product: box.product,
                                    internalId: box.internalId,
                                    weight: box.weight,
                                    maxWeightTon: box.maxWeightTon,
                                    layer: box.layer,
                                    palletNetWeight: box.palletNetWeight,
                                    netWeight: box.netWeight,
                                    grossWeight: box.grossWeight,
                                    noOfPallets: box.noOfPallets,
                                    palletsPerContainer: box.palletsPerContainer,
                                    palletsPerLayer: box.palletsPerLayer,
                                    productLayer: box.layer,
                                    parent: box.parent,
                                    displayName: box.displayName,
                                    reamsPerContainer: box.reamsPerContainer,
                                    boxesPerContainer: box.boxesPerContainer,
                                    minOccupiedHeight: minOccupiedHeight,
                                    recommendedItems: box.recommendedItems,
                                    sortedRecommendedItems: box.sortedRecommendedItems
                                });
                                
                                grandTotalCutsize += bestFitRotation.price;
                                x += bestFitRotation.width;
                                
                                if (x + bestFitRotation.width > containerData.width) {
                                    x = 0;
                                    z += bestFitRotation.length;
                                }
                                
                                var layers = parseInt(bestFitRotation.layer.slice(0, -1));
                                
                                if (z + bestFitRotation.length > containerData.length) {
                                    if (layerCountCutsize + 1 < layers) {
                                        z = 0;
                                        y += bestFitRotation.height;
                                        
                                        totPalletsPerLayer = 0;
                                        palletsPerLayerCutsize = 0;
                                        layerCountCutsize++;
                                    }
                                }
                                
                                
                                occupiedHeights[positionKey] = Math.max(occupiedHeightAtPosition, occupiedHeightAtPosition + bestFitRotation.height);
                                balanceLength = containerData.length - z;
                                balanceWidth = containerData.width - x;
                                balanceHeight = containerData.height - occupiedHeights[positionKey];
                            }
                            
                        } else {
                       //     log.debug('No valid box to fit:', box);
                            currentBox = box;
                            currentProductCount = currentProductCount;
                            
                            allContainersCutsize.push({
                                packedBoxes: packedBoxesCutsize,
                                containerListCutsize: containerListCutsize
                            });
                            
                            x = 0;
                            y = 0;
                            z = 0;
                            packedBoxesCutsize = [];
                            occupiedHeights = {};
                            heightMap = {};
                            layerCountCutsize = 0;
                            palletsPerLayerCutsize = 0;
                            
                            totPalletsPerLayer = 1;
                            
                            if (box.width < box.length) {
                                var temp = box.width;
                                box.width = box.length;
                                box.length = temp;
                            }
                            
                            if (canFit({
                                remainingLength: containerData.length,
                                remainingWidth: containerData.width,
                                remainingHeight: containerData.height
                            }, box)) {
                                packedBoxesCutsize.push({
                                    x: x,
                                    y: y,
                                    z: z,
                                    originalDimensions: box,
                                    box: box,
                                    color: currentItemColor,
                                    remainingDimensions: {
                                        remainingLength: containerData.length - box.length,
                                        remainingWidth: containerData.width - box.width,
                                        remainingHeight: containerData.height - box.height
                                    },
                                    type: box.type,
                                    product: box.product,
                                    internalId: box.internalId,
                                    weight: box.weight,
                                    layer: layerCountCutsize,
                                    netWeight: box.netWeight,
                                    grossWeight: box.grossWeight,
                                    noOfPallets: 1,
                                    palletsPerLayer: 1,
                                    productLayer: box.layer,
                                    parent: box.parent,
                                    displayName: box.displayName,
                                    reamsPerContainer: box.reamsPerContainer,
                                    boxesPerContainer: box.boxesPerContainer,
                                    recommendedItems: box.recommendedItems,
                                    sortedRecommendedItems: box.sortedRecommendedItems
                                });
                                
                                x = box.width;
                           //     log.debug('Placed current box in new container:', box);
                            } else {
                                log.debug('Current box still cannot fit in the new container:', box);
                            }
                        }
                    }
                    
                });
                
                if (packedBoxesCutsize.length > 0) {
                    allContainersCutsize.push(
                        {
                            packedBoxes: packedBoxesCutsize,
                            containerListCutsize: containerListCutsize
                        });
                }
                
             
                
            }
            
            
            // to generate 2 best options for item recommendation
            if (itemRecommendation === true || parsedBody.selectedStatus === "adjustedQty") {
              
                
                var allBoxes = [];
                var boxes = boxes || {};
                var bin = bin || {};
                var qtyToAdd = 0;
                
                function mergeObjects(target, source) {
                    Object.keys(source).forEach(function (key) {
                        if (!target[key]) {
                            target[key] = [];
                        }
                        target[key] = target[key].concat(source[key]);
                    });
                }
                
                if (hasCutsize) {
                    mergeObjects(boxes, boxesCutsize);
                    mergeObjects(bin, containerData);
                }
                // Normalize and flatten all box items
                Object.keys(boxes).forEach(function (parent) {
                    var items = boxes[parent];
                    var heaviestBox = null;
                    
                    items.forEach(function (box) {
                        
                        if (!heaviestBox || box.netWeightPerPallet > heaviestBox.netWeightPerPallet) {
                            heaviestBox = box;
                            
                            qtyToAdd = totalBalanceWeight;  //totalbalanceweight is the balance of input qty needed to be added/ reduced to make it FCL
                            var palletsAfterAddQty = Math.floor(((qtyToAdd + InputQty) * 1000) / totalNetWeightPerPallet);
                            // log.debug('palletsAfterAddQty', palletsAfterAddQty);
                            // log.debug('qtyToAdd', qtyToAdd);
                            while (palletsAfterAddQty > 0 && palletsAfterAddQty > box.containerData.maxWeight) {
                                qtyToAdd -= 0.1; // reduce 1 unit
                                palletsAfterAddQty = Math.floor(((qtyToAdd + InputQty) * 1000) / totalNetWeightPerPallet);
                            }
                            
                        }
                        
                        if (box.baseUnitAbbreviation) {
                            var baseUnit = box.baseUnitAbbreviation.toLowerCase();
                            box.weight = (box.weight * box.uomConversionRates[baseUnit]) / box.uomConversionRates.ton;
                            box.maxWeightTon = box.weight;
                        }
                        
                        if (parsedBody.selectedStatus === "adjustedQty") {
                            for (var s = 0; s < parsedBody.selectedOption.length; s++) {
                                var selectedProductId = parsedBody.selectedOption[s].custpage_product.id;
                                var adjustedQty = parsedBody.selectedOption[s].suggestedQty;
                                var parentID = parsedBody.selectedOption[s].parentID;
                                
                                if (box.internalId === selectedProductId) {
                                    allBoxes.push({
                                        parentID: parentID,
                                        box: box,
                                        quantity: adjustedQty
                                    });
                                }
                            }
                        } else {
                            allBoxes.push({box: heaviestBox, qtyToAdd: qtyToAdd});
                        }
                    });
                });
                
         
                
                // Get top 2 recommendations where each option can have multiple items
                var recommendedOptions = recommendTop2Boxes(
                    allBoxes,
                    totalBalanceWeight
                );
                
                log.debug('recommendedoptikons', recommendedOptions);
                if (recommendedOptions && recommendedOptions.length > 0) {
                    recommendedBestFitItems = {
                        option1: recommendedOptions.map(function (opt) {
                            return {
                                type: opt.type || "",
                                action: opt.action || "",
                                internalId: opt.internalId || "",
                                parentID: opt.parentID || "",
                                displayName: opt.displayName || "",
                                suggestedQty: opt.suggestedQty || 0,
                                uom: opt.uom || ""
                            };
                        })
                    };
                }
                
                // Log or return the structured recommendation
                log.debug("Recommendation Result", recommendedBestFitItems);
                
            }
        }
        
        // Recommendation function
        function recommendTop2Boxes(boxes, totalBalanceWeight) {
            var allValidFits = [];
            var fitOptions = [];
            
            for (var i = 0; i < boxes.length; i++) {
                var box = boxes[i].box;
                var qtyToAdd = boxes[i].qtyToAdd;
                
                if (parsedBody.selectedStatus === "adjustedQty") {
                    var qtyToAdd = boxes[i].quantity;
                    if (qtyToAdd <= totalBalanceWeight) {
                        var palletsPerContainer = qtyToAdd;
                    } else {
                        var palletsPerContainer = 0;
                    }
                    
                } else {
                    
                    var palletsPerContainer = totalBalanceWeight;
                }
                
                if (palletsPerContainer > 0) {
                    
                    allValidFits.push({
                        box: box,
                        palletsPerContainer: qtyToAdd,
                        totalWeight: palletsPerContainer
                    });
                    
                }
                
            }
            
            // Group valid fits by unique box ID
            var uniqueFitsMap = {};
            for (var i = 0; i < allValidFits.length; i++) {
                var fit = allValidFits[i];
                var id = fit.box.internalId;
                
                // Only take one fit per unique item ID
                if (!uniqueFitsMap[id]) {
                    uniqueFitsMap[id] = fit;
                }
            }
            
            // Convert to array and only push if we have at least 2 different items applied only if it isn't adjustedqty
            var uniqueFits = Object.values(uniqueFitsMap);
            
            if (parsedBody.selectedStatus === "adjustedQty") {
                // Just push whatever available (even 1 or none)
                for (var i = 0; i < uniqueFits.length; i++) {
                    fitOptions.push(uniqueFits[i]);
                }
            } else {
                // Collect fit options
                if (uniqueFits.length > 0) {
                    fitOptions.push(uniqueFits[0]);
                    if (uniqueFits.length >= 2) {
                        fitOptions.push(uniqueFits[1]);
                    }
                }
            }
            
            // Sort the options by total weight descending
            fitOptions.sort(function (a, b) {
                return b.totalWeight - a.totalWeight;
            });
            
            // Always return up to 2 recommendations
            var recommended = [];
            var type = null;
            for (var k = 0; k < Math.min(2, fitOptions.length); k++) {
                
                if (fitOptions[k].type !== 'mixed') {
                    type = 'dedicated';
                } else {
                    type = 'mixed';
                }
                
                recommended.push({
                    type: type,
                    action: action,
                    internalId: fitOptions[k].box.internalId,
                    parentID: fitOptions[k].box.parentID,
                    displayName: fitOptions[k].box.parentName,
                    suggestedQty: fitOptions[k].palletsPerContainer,
                    uom: fitOptions[k].baseUnitAbbreviation
                });
            }
            
            return recommended;
            
        }
        
        
        // Ensure boxes are sorted by weight and volume before running the bin packing algorithm
        var sortedBoxesCutsize = sortByWeightAndVolume(boxesCutsize);
        
        // Cutsize, Folio, Mixed Calculation
        greedyBinPacking(sortedBoxesCutsize, containerData);
        
        
        var recommendedItems = 0;
        var sortedRecommendedItems = 0;
        var layerCountForContainer = 0;
        
        var totalReamsCutsize = 0;
        var totalBoxesCutsize = 0;
        var totalPalletsCutsize = 0;
        
        var cutsizeResult3D = allContainersCutsize.map(function (containerWrapper, containerIndex) {
            var container = containerWrapper.packedBoxes; // Access packedBoxes directly
            
            // Calculate layers and items per layer for this container
            container.forEach(function (box, index) {
                if (index > 0 && box.y > container[index - 1].y) {
                    layerCountForContainer++;
                }
            });
            
            var uniqueParent = {};
            var containerNetWeight = [];
            var containerNetWeightKG = [];
            var containerGrossWeight = [];
            var containerGrossWeightKG = [];
            var noOfPallets = [];
            var palletsPerLayer = [];
            var reams = [];
            var boxes = [];
            var minOccupiedHeight = 0;
            var totalReamsPerContainer = 0;
            var totalBoxesPerContainer = 0;
            for (var i = 0; i < container.length; i++) {
                
                var netWeight = container[i].netWeight.toFixed(3);
                var netWeightKG = container[i].netWeight.toFixed(3) * 1000;
                var grossWeight = container[i].grossWeight.toFixed(3);
                var grossWeightKG = container[i].grossWeight.toFixed(3) * 1000;
                var pallets = container[i].palletsPerContainer;
                var product = container[i].product;
                
                if (!uniqueParent[product]) { // Check if weight is already added
                    containerNetWeight.push(netWeight);
                    containerNetWeightKG.push(netWeightKG);
                    containerGrossWeight.push(grossWeight);
                    containerGrossWeightKG.push(grossWeightKG);
                    noOfPallets.push(pallets);
                    palletsPerLayer.push(container[i].palletsPerLayer);
                    reams.push(container[i].reamsPerContainer);
                    boxes.push(container[i].boxesPerContainer);
                    totalReamsPerContainer += container[i].reamsPerContainer;
                    totalBoxesPerContainer += container[i].boxesPerContainer;
                    totalPalletsCutsize += container[i].palletsPerContainer || 0;
                    
                    uniqueParent[product] = true; // Mark as added
                }
                recommendedItems = container[i].recommendedItems;
                minOccupiedHeight = container[i].minOccupiedHeight;
            }
            
            totalReamsCutsize = totalReamsPerContainer;
            totalBoxesCutsize = totalBoxesPerContainer;
            layerCountForContainer += 1;
            
            return {
                containerIndex: containerIndex + 1,
                type: 'Cutsize',
                layersUsed: layerCountForContainer,
                palletsPerLayer: palletsPerLayer,
                palletsPerContainer: noOfPallets,
                width: containerData.width,        // Bin width for Cutsize
                height: containerData.height,      // Bin height for Cutsize
                length: containerData.length,      // Bin length for Cutsize
                containerNetWeight: containerNetWeight,
                containerNetWeightKG: containerNetWeightKG,
                containerGrossWeight: containerGrossWeight,
                containerGrossWeightKG: containerGrossWeightKG,
                reams: reams,
                boxes: boxes,
                totalReamsPerContainer: totalReamsCutsize,
                totalBoxesPerContainer: totalBoxesCutsize,
                
                recommendedItems: recommendedItems && recommendedItems.length > 0
                    ? recommendedItems.map(function (item) {
                        return {
                            layer: item.layer,
                            maxQuantity: item.maxQuantity,
                            width: item.width.toFixed(2),
                            height: item.height.toFixed(2),
                            length: item.length.toFixed(2),
                        };
                    })
                    : null,
                
                item: container.map(function (packedBox) {
                    return {
                        product: packedBox.product,
                        internalId: packedBox.internalId,
                        displayName: packedBox.displayName,
                        position: {
                            x: packedBox.x,
                            y: packedBox.y,
                            z: packedBox.z
                        },
                        originalDimensions: {
                            width: packedBox.originalDimensions.width,
                            height: packedBox.originalDimensions.height,
                            length: packedBox.originalDimensions.length,
                            weight: packedBox.originalDimensions.weight
                        },
                        packedDimensions: {
                            width: packedBox.box.width,
                            height: packedBox.box.height,
                            length: packedBox.box.length
                        },
                        remainingDimensions: {
                            width: packedBox.remainingDimensions.remainingWidth.toFixed(2),
                            height: packedBox.remainingDimensions.remainingHeight.toFixed(2),
                            length: packedBox.remainingDimensions.remainingLength.toFixed(2)
                        },
                        color: packedBox.color,
                        type: packedBox.type,
                        productLayer: packedBox.box.layer,
                        pallet: true,
                    };
                })
            };
        });
        // ✅ Step 1: Collect all items across all containerWrappers
        var allItems = [];
        // log.debug('allrecordcutsize', allRecordCutsize);
        // log.debug('allrecordcutsize.length', allRecordCutsize.length);
        allRecordCutsize.forEach(function (containerWrapper) {
            if (containerWrapper.containerListCutsize) {
                allItems = allItems.concat(containerWrapper.containerListCutsize);
            }
        });
        
        // ✅ Step 2: Group by containerNo (avoid duplicate containers)
        var groupedByContainer = {};
        allItems.forEach(function (packedBox) {
            var containerNo = packedBox.containerNo;
            
            if (!groupedByContainer[containerNo]) {
                groupedByContainer[containerNo] = [];
            }
            
            // Prevent duplicate items inside same container
            var alreadyExists = groupedByContainer[containerNo].some(function (item) {
                return item.internalId === packedBox.internalId;
            });
            
            if (!alreadyExists) {
                groupedByContainer[containerNo].push(packedBox);
            }
        });
        
        // ✅ Step 3: Build final cutsizeResultConcal
        var cutsizeResultConcal = Object.keys(groupedByContainer).map(function (containerNo) {
            var itemsInContainer = groupedByContainer[containerNo];
            var totalPalletsCopyPaper = 0;
            var totalReamsCutsize = 0;
            var totalBoxesCutsize = 0;
            
            var formattedItems = itemsInContainer.map(function (packedBox) {
                
                totalPalletsCopyPaper += packedBox.palletsPerContainer;
                totalReamsCutsize += packedBox.reamsPerContainer;
                totalBoxesCutsize += packedBox.boxesPerContainer;
                
                return {
                    product: packedBox.product,
                    internalId: packedBox.internalId,
                    displayName: packedBox.displayName,
                    type: packedBox.type,
                    layer: layerCountForContainer,
                    netWeight: packedBox.netWeight.toFixed(3),
                    netWeightKG: (packedBox.netWeight * 1000).toFixed(3),
                    grossWeight: packedBox.grossWeight.toFixed(3),
                    grossWeightKG: (packedBox.grossWeight * 1000).toFixed(3),
                    reams: (Math.floor(packedBox.reamsPerContainer) || 0) + ' RM',
                    boxes: (Math.floor(packedBox.boxesPerContainer) || 0) + ' CAR',
                    palletsPerContainer: (Math.floor(packedBox.palletsPerContainer) || 0) + ' PAL',
                    palletsPerLayer: (Math.floor(packedBox.palletsPerLayer) || 0) + ' PAL',
                    productLayer: packedBox.productLayer,
                    price: 0.0
                };
            });
            
            return {
                containerIndex: Number(containerNo),
                containerSize: containerData,
                totalReamsCopyPaper: (Math.floor(totalReamsCutsize) || 0) + ' RM',
                totalBoxesCopyPaper: (Math.floor(totalBoxesCutsize) || 0) + ' CAR',
                totalPalletsCopyPaper: (Math.floor(totalPalletsCopyPaper) || 0) + ' PAL',
                item: formattedItems
            };
        });
        
        
        var combinedResults3D = [];
        var combinedResultsConcal = [];
        
        // combine cutsize
        for (var i = 0; i < cutsizeResult3D.length; i++) {
            combinedResults3D.push(cutsizeResult3D[i]);
        }
        
        for (var i = 0; i < cutsizeResultConcal.length; i++) {
            combinedResultsConcal.push(cutsizeResultConcal[i]);
        }
        
        
        var transformed = {
            containers: [],
        };
        
        if (!parsedBody.selectedOption || parsedBody.selectedOption.length === 0) {
            transformed.recommendedItems = recommendedBestFitItems;
        } else {
            transformed.selectedOption = parsedBody.selectedOption;
            
            if (parsedBody.selectedStatus === "adjustedQty") {
                
                var nonNullCount = 0;
                
                for (var key in recommendedBestFitItems) {
                    var arr = recommendedBestFitItems[key];
                    var valid = false;
                    
                    for (var i = 0; i < arr.length; i++) {
                        
                        if (arr[i] !== null && arr[i] !== undefined) {
                            valid = true;
                            break;
                        }
                    }
                    
                    if (valid) {
                        nonNullCount++;
                    }
                }
                
                if (nonNullCount === 0) {
                    transformed.adjustedQtyStatus = "overLimit";
                } else {
                    transformed.adjustedQtyStatus = "ok";
                }
            }
        }
        
        for (var i = 0; i < combinedResultsConcal.length; i++) {
            var container = combinedResultsConcal[i];
            transformed.containers.push(container);
        }
        
        // Convert the combined result to JSON format
        var jsonResult3D = combinedResults3D
        var jsonResultConcal = transformed
        
        try {
          //  saveFile(jsonResultConcal, jsonResult3D)
            if (parsedBody.action == 'viewContainerList') {
                return jsonResultConcal
              
            } else if (parsedBody.action == 'view3D') {
                return jsonResult3D
            }
        } catch (e) {
            log.error('Error Sending Data to Suitelet', e);
            throw e;
        }
        
    }
    
    function sortByWeightAndVolume(groups) {
        // Iterate over each group using a for loop
        for (var group in groups) {
            if (groups.hasOwnProperty(group)) {
                // Sort each group's items by weight and volume
                groups[group].sort(function (a, b) {
                    if (b.weight !== a.weight) {
                        return b.weight - a.weight; // Sort by weight first
                    } else {
                        return (b.length * b.width * b.height) - (a.length * a.width * a.height); // Sort by volume if weights are equal
                    }
                });
            }
        }
        
        // Sort the groups themselves based on the first item's weight in each group
        var sortedGroups = Object.keys(groups);
        if (sortedGroups.length > 1) {
            sortedGroups.sort(function (a, b) {
                if (!groups[a].length || !groups[b].length) {
                    return 0;
                }
                
                var totalWeightA = 0;
                var totalWeightB = 0;
                for (var i = 0; i < groups[a].length; i++) {
                    totalWeightA += groups[a][i].weight || 0;
                }
                for (var j = 0; j < groups[b].length; j++) {
                    totalWeightB += groups[b][j].weight || 0;
                }
                
                if (totalWeightB !== totalWeightA) {
                    return totalWeightB - totalWeightA; // Sort by total weight first
                } else {
                    var totalVolumeA = 0;
                    var totalVolumeB = 0;
                    
                    for (var i = 0; i < groups[a].length; i++) {
                        totalVolumeA += (groups[a][i].length || 0) * (groups[a][i].width || 0) * (groups[a][i].height || 0);
                    }
                    for (var j = 0; j < groups[b].length; j++) {
                        totalVolumeB += (groups[b][j].length || 0) * (groups[b][j].width || 0) * (groups[b][j].height || 0);
                    }
                    
                    return totalVolumeB - totalVolumeA; // Sort by total volume if weights are equal
                }
            });
        }
        
        
        // Reorder the groups object based on the sorted group keys
        var orderedGroups = {};
        for (var i = 0; i < sortedGroups.length; i++) {
            var groupKey = sortedGroups[i];
            orderedGroups[groupKey] = groups[groupKey];
        }
        
        return orderedGroups;
    }
    
    
    
    function generateLogicalRotations(box) {
        return [
            {
                width: box.width,
                height: box.height,
                length: box.length,
                weight: box.weight,
                product: box.product,
                price: box.price,
                layer: box.layer
            },
            {
                width: box.length,
                height: box.height,
                length: box.width,
                weight: box.weight,
                product: box.product,
                price: box.price,
                layer: box.layer
            }
        ];
    }
    
    function canFit(currentPosition, box) {
        return (
            box.length <= currentPosition.remainingLength &&
            box.width <= currentPosition.remainingWidth &&
            box.height <= currentPosition.remainingHeight
        );
    }
    
    
    function saveFile(jsonResultConcal, jsonResult3D){
        // Save data into file cabinet
        var fileObj3D = file.create({
            name: '3D_input_ftn_new.json',
            fileType: file.Type.JSON,
            contents: JSON.stringify(jsonResult3D),
            folder: 12262
        });
        fileId3D = fileObj3D.save();
        
        var fileObjConcal = file.create({
            name: 'ConCal_input_ftn.json',
            fileType: file.Type.JSON,
            contents:  JSON.stringify(jsonResultConcal),
            folder: 17979
        });
        var fileIdConcal = fileObjConcal.save();
        log.debug('File Saved', 'File ID 3D Input: ' + fileId3D);
        log.debug('File Saved', 'File ID Concal Input: ' + fileIdConcal);
    }
    
    return {greedyCalcCutsize}
})























