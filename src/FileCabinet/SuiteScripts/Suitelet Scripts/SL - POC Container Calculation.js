/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */

/**
 * SuiteScript 2.0 Template - Suitelet Script
 *
 * @summary Suitelet Script 2.0 Template
 *
 * @author fatin <fatinnadhrah@teibto.com>
 *
 * @version 1
 * @requires -
 *
 * @changes 1 Create Script
 */

var error, file, record, runtime, search, serverWidget, https, libCode, log, cache;

var MODULE = new Array();
MODULE.push('N/error');
MODULE.push('N/file');
MODULE.push('N/record');
MODULE.push('N/runtime');
MODULE.push('N/search');
MODULE.push('N/ui/serverWidget');
MODULE.push('N/https');
MODULE.push('SuiteScripts/Lib/Libraries Code 2.0.220622.js');
MODULE.push('N/log');
MODULE.push('N/cache');


define(MODULE, function (_error, _file, _record, _runtime, _search, _serverWidget, _https, _libCode, _log, _cache) {
    error = _error;
    file = _file;
    record = _record;
    runtime = _runtime;
    search = _search;
    serverWidget = _serverWidget;
	https = _https;
    libCode = _libCode;
    log = _log;
    cache = _cache;

    return {
        onRequest: OnRequest
    };
});

/**
 * Definition of the Suitelet script trigger point.
 * 
 * @param {Object} context
 * @param {ServerRequest} request context.request - Encapsulation of the incoming request
 * @param {ServerResponse} response context.response - Encapsulation of the Suitelet response
 * @Since 2015.2
 */

var CACHE_NAME = 'temporaryDataCache';
function OnRequest(context, request, response) {

    var myCache = cache.getCache({ name: CACHE_NAME, scope: cache.Scope.PUBLIC });

    request = context.request;
    response = context.response;
    
    var recommendedBestFitItems = [];
    var containerListMixed = [];
    var packedBoxesMixed = [];
    var containerListCutsize = [];
    var packedBoxesCutsize = [];
    var containerListFolio = [];
    var packedBoxesFolio = [];
    var containerListWrapper = [];
    var packedBoxesWrapper = [];
    var containerListRoll = [];
    var packedBoxesRoll = [];
    var containerListCMSheet = [];
    var packedBoxesCMSheet = [];
    var containerListCMRoll = [];
    var packedBoxesCMRoll = [];
    var containerListHoneycomb = [];
    var packedBoxesHoneycomb = [];
    var containerListPulp = [];
    var packedBoxesPulp = [];
    var containerListBoxCover = [];
    var packedBoxesBoxCover = [];
    var containerListDAN = [];
    var packedBoxesDAN = [];
    var containerListDAOS = [];
    var packedBoxesDAOS = [];
    var containerListDACP = [];
    var packedBoxesDACP = [];

    var containerNo = 0;

    var grandTotalMixed = 0;
    var grandTotalCutsize = 0;
    var grandTotalDACP = 0;
    var totalPriceByProductFolio = {};
    var grandTotalFolio = 0;
    var netWeightFolio = 0;
    var grossWeightFolio = 0;

    var totalPriceByProductHoneycomb = {};
    var grandTotalHoneycomb = 0;
    var netWeightHoneycomb = 0;
    var grossWeightHoneycomb = 0;
    
    var totalPriceByProductPulp = {};
    var grandTotalPulp = 0;
    var netWeightPulp = 0;
    var grossWeightPulp = 0;

    var totalPriceByProductBoxCover = {};
    var grandTotalBoxCover = 0;
    var netWeightBoxCover = 0;
    var grossWeightBoxCover = 0;
    
    var totalPriceByProductDAN = {};
    var grandTotalDAN = 0;
    var netWeightDAN = 0;
    var grossWeightDAN = 0;

    var totalPriceByProductDAOS = {};
    var grandTotalDAOS = 0;
    var netWeightDAOS = 0;
    var grossWeightDAOS = 0;

    var totalPriceByProductCMSheet = {};
    var grandTotalCMSheet = 0;
    var netWeightCMSheet = 0;
    var grossWeightCMSheet = 0;

    var layerCountMixed = 0;
    var layerCountCutsize = 0;
    var layerCountFolio = 0;
    var layerCountHoneycomb = 0;
    var layerCountCMSheet = 0;
    var layerCountPulp = 0;
    var layerCountBoxCover = 0;
    var layerCountDAN = 0;
    var layerCountDAOS = 0;
    var layerCountDACP = 0;

    var palletsPerLayerMixed = 0;
    var palletsPerLayerCutsize = 0;
    var palletsPerLayerFolio = 0;
    var palletsPerLayerHoneycomb = 0;
    var palletsPerLayerCMSheet = 0;
    var palletsPerLayerPulp = 0;
    var palletsPerLayerBoxCover = 0;
    var palletsPerLayerDAN = 0;
    var palletsPerLayerDAOS = 0;
    var palletsPerLayerDACP = 0;

    var itemsPerLayerMixed = [];
    var itemsPerLayerCutsize = [];
    var itemsPerLayerFolio = [];
    var itemsPerLayerHoneycomb = [];
    var itemsPerLayerCMSheet = [];
    var itemsPerLayerPulp = [];
    var itemsPerLayerBoxCover = [];
    var itemsPerLayerDAN = [];
    var itemsPerLayerDAOS = [];
    var itemsPerLayerDACP = [];

    var allContainersMixed = [];
    var boxesMixed3D = [];
    var allRecordCutsize = [];
    var allContainersCutsize = [];
    var boxesCutsize3D = [];
    var allContainersFolio = [];
    var boxesFolio3D = [];
    var allContainersWrapper = [];
    var boxesWrapper3D = [];
    var allContainersRoll = [];
    var boxesRoll3D = [];
    var allContainersCMSheet = [];
    var boxesCMSheet3D = [];
    var allContainersCMRoll = [];
    var boxesCMRoll3D = [];
    var allContainersHoneycomb = [];
    var boxesHoneycomb3D = []; 
    var allContainersPulp = [];
    var boxesPulp3D = [];
    var allContainersBoxCover = [];
    var boxesBoxCover3D = [];
    var allContainersDAN = [];
    var boxesDAN3D = [];
    var allContainersDAOS = [];
    var boxesDAOS3D = [];
    var allContainersDACP = [];
    var boxesDACP3D = [];

    var totalBalanceWeight = 0;
    var totalNetWeightPerPallet = 0;
    var totalPalletsPerContainer = 0;
    var itemRecommendation = false;
    var action = null;

    var colors = [
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

    if(context.request.method === 'POST'){

        var rawRequestBody = context.request.body;
        var chunkSize = 4000; // NetSuite log limit per entry

        if (rawRequestBody.length <= chunkSize) {
            log.debug('Raw Request Body', rawRequestBody);
        } else {
            var numChunks = Math.ceil(rawRequestBody.length / chunkSize);
            for (var i = 0; i < numChunks; i++) {
                var chunk = rawRequestBody.substring(i * chunkSize, (i + 1) * chunkSize);
                log.debug('Raw Request Body - Chunk ' + (i + 1) + '/' + numChunks, chunk);
            }
        }

        // Check if request body exists
        if (!context.request.body) {
            log.debug('Empty Request Body');
            context.response.write(JSON.stringify({
                status: 'error',
                message: 'Request body is empty or missing'
            }));
            return;
        }

        // Parse JSON request body
        var parsedBody;
        try {
            parsedBody = JSON.parse(context.request.body);
        } catch (parseError) {
            log.error('JSON Parse Error', parseError);
            context.response.write(JSON.stringify({
                status: 'error',
                message: 'Invalid JSON format in request body',
                details: parseError.message
            }));
            return;
        }
        
        // mixed
        function getAllBoxesMixed() {
            var boxesMixed = parsedBody.boxesMixed || [];
            return boxesMixed;
        }
        var boxesMixed = getAllBoxesMixed();

        // cutsize
        function getAllBoxesCutsize() {
            var boxesCutsize = parsedBody.boxesCutsize || [];
            return boxesCutsize;
        }
        var boxesCutsize = getAllBoxesCutsize();

        // folio 
        function getAllBoxesFolio() {
            var boxesFolio = parsedBody.boxesFolio || [];
            return boxesFolio;
        }
        var boxesFolio = getAllBoxesFolio();
        
        // wrapper
        function getAllBoxesWrapper() {
            var boxesWrapper = parsedBody.boxesWrapper || [];
            return boxesWrapper;
        }
        var boxesWrapper = getAllBoxesWrapper();

        // roll
        function getAllBoxesRoll() {
            var boxesRoll = parsedBody.boxesRoll || [];
            return boxesRoll;
        }
        var boxesRoll = getAllBoxesRoll();

        // CM Sheet
        function getAllBoxesCMSheet() {
            var boxesCMSheet = parsedBody.boxesCMSheet || [];
            return boxesCMSheet;
        }
        var boxesCMSheet = getAllBoxesCMSheet();

        // CM Roll
        function getAllBoxesCMRoll() {
            var boxesCMRoll = parsedBody.boxesCMRoll || [];
            return boxesCMRoll;
        }
        var boxesCMRoll = getAllBoxesCMRoll();

        // honeycomb 
        function getAllBoxesHoneycomb() {
            var boxesHoneycomb = parsedBody.boxesHoneycomb || [];
            return boxesHoneycomb;
        }
        var boxesHoneycomb = getAllBoxesHoneycomb();
        
        // Pulp
        function getAllBoxesPulp() {
            var boxesPulp = parsedBody.boxesPulp || [];
            return boxesPulp;
        }
        var boxesPulp = getAllBoxesPulp();

        // Box and Cover
        function getAllBoxesBoxCover() {
            var boxesBoxCover = parsedBody.boxesBoxCover || [];
            return boxesBoxCover;
        }
        var boxesBoxCover = getAllBoxesBoxCover();

        // DAN
        function getAllBoxesDAN() {
            var boxesDAN = parsedBody.boxesDAN || [];
            return boxesDAN;
        }
        var boxesDAN = getAllBoxesDAN();

        // DAOS
        function getAllBoxesDAOS() {
            var boxesDAOS = parsedBody.boxesDAOS || [];
            return boxesDAOS;
        }
        var boxesDAOS = getAllBoxesDAOS();

        // DACP
        function getAllBoxesDACP() {
            var boxesDACP = parsedBody.boxesDACP || [];
            return boxesDACP;
        }
        var boxesDACP = getAllBoxesDACP();


        // container
        var binMixed = { length: 232.13, width: 92.52, height: 93.90 };
        if (boxesMixed && typeof boxesMixed === 'object') {
            var firstKey = Object.keys(boxesMixed)[0]; // Get the first product name key
            if (firstKey && boxesMixed[firstKey].length > 0) {
                binMixed = boxesMixed[firstKey][0].binMixed || null;
            }
        }

        var binCutsize = { length: 232.13, width: 92.52, height: 93.90 };
        if (boxesCutsize && typeof boxesCutsize === 'object') {
            var firstKey = Object.keys(boxesCutsize)[0]; // Get the first product name key
            if (firstKey && boxesCutsize[firstKey].length > 0) {
                binCutsize = boxesCutsize[firstKey][0].binCutsize || null;
            }
        }

        var binFolio = { length: 232.13, width: 92.52, height: 93.90 };
        if (boxesFolio && typeof boxesFolio === 'object') {
            var firstKey = Object.keys(boxesFolio)[0]; // Get the first product name key
            if (firstKey && boxesFolio[firstKey].length > 0) {
                binFolio = boxesFolio[firstKey][0].binFolio || null;
            }
        }

        var binHoneycomb = { length: 232.13, width: 92.52, height: 93.90 };
        if (boxesHoneycomb && typeof boxesHoneycomb === 'object') {
            var firstKey = Object.keys(boxesHoneycomb)[0]; // Get the first product name key
            if (firstKey && boxesHoneycomb[firstKey].length > 0) {
                binHoneycomb = boxesHoneycomb[firstKey][0].binHoneycomb || null;
            }
        }

        var binPulp = { length: 232.13, width: 92.52, height: 93.90 };
        if (boxesPulp && typeof boxesPulp === 'object') {
            var firstKey = Object.keys(boxesPulp)[0]; // Get the first product name key
            if (firstKey && boxesPulp[firstKey].length > 0) {
                binPulp = boxesPulp[firstKey][0].binPulp || null;
            }
        }

        var binBoxCover = { length: 232.13, width: 92.52, height: 93.90 };
        if (boxesBoxCover && typeof boxesBoxCover === 'object') {
            var firstKey = Object.keys(boxesBoxCover)[0]; // Get the first product name key
            if (firstKey && boxesBoxCover[firstKey].length > 0) {
                binBoxCover = boxesBoxCover[firstKey][0].binBoxCover || null;
            }
        }

        var binDAN = { length: 232.13, width: 92.52, height: 93.90 };
        if (boxesDAN && typeof boxesDAN === 'object') {
            var firstKey = Object.keys(boxesDAN)[0]; // Get the first product name key
            if (firstKey && boxesDAN[firstKey].length > 0) {
                binDAN = boxesDAN[firstKey][0].binDAN || null;
            }
        }
        
        var binDAOS = { length: 232.13, width: 92.52, height: 93.90 };
        if (boxesDAOS && typeof boxesDAOS === 'object') {
            var firstKey = Object.keys(boxesDAOS)[0]; // Get the first product name key
            if (firstKey && boxesDAOS[firstKey].length > 0) {
                binDAOS = boxesDAOS[firstKey][0].binDAOS || null;
            }
        }

        var binDACP = { length: 232.13, width: 92.52, height: 93.90 };
        if (boxesDACP && typeof boxesDACP === 'object') {
            var firstKey = Object.keys(boxesDACP)[0]; // Get the first product name key
            if (firstKey && boxesDACP[firstKey].length > 0) {
                binDACP = boxesDACP[firstKey][0].binDACP || null;
            }
        }

        var binWrapper = { length: 228, width: 90, height: 90 }; 
        if (boxesWrapper && typeof boxesWrapper === 'object') {
            var firstKey = Object.keys(boxesWrapper)[0]; // Get the first product name key
            if (firstKey && boxesWrapper[firstKey].length > 0) {
                binWrapper = boxesWrapper[firstKey][0].binWrapper || null;
            }
        }
        var wrapperResults = calculateWrappers(binWrapper, boxesWrapper);

        var binRoll = { length: 228, width: 90, height: 90 }; 
        if (boxesRoll && typeof boxesRoll === 'object') {
            var firstKey = Object.keys(boxesRoll)[0]; // Get the first product name key
            if (firstKey && boxesRoll[firstKey].length > 0) {
                binRoll = boxesRoll[firstKey][0].binRoll || null;
            }
        }
        var rollResults = calculateRolls(binRoll, boxesRoll);

        var binCMSheet = { length: 232.13, width: 92.52, height: 93.90 };
        if (boxesCMSheet && typeof boxesCMSheet === 'object') {
            var firstKey = Object.keys(boxesCMSheet)[0]; // Get the first product name key
            if (firstKey && boxesCMSheet[firstKey].length > 0) {
                binCMSheet = boxesCMSheet[firstKey][0].binCMSheet || null;
            }
        }

        var binCMRoll = { length: 228, width: 90, height: 90 }; 
        if (boxesCMRoll && typeof boxesCMRoll === 'object') {
            var firstKey = Object.keys(boxesCMRoll)[0]; // Get the first product name key
            if (firstKey && boxesCMRoll[firstKey].length > 0) {
                binCMRoll = boxesCMRoll[firstKey][0].binCMRoll || null;
            }
        }
        var cmRollResults = calculateCMRolls(binCMRoll, boxesCMRoll);

        function generateLogicalRotations(box) {
            return [
                { width: box.width, height: box.height, length: box.length, weight: box.weight, product: box.product, price: box.price, layer: box.layer},  
                { width: box.length, height: box.height, length: box.width, weight: box.weight, product: box.product, price: box.price, layer: box.layer}   
            ];
        }

        function canFit(currentPosition, box) {
            return (
                box.length <= currentPosition.remainingLength &&  
                box.width <= currentPosition.remainingWidth &&    
                box.height <= currentPosition.remainingHeight     
            );
        }
        
        function greedyBinPacking(boxesMixed, boxesCutsize, boxesFolio, boxesHoneycomb, boxesPulp, boxesBoxCover, boxesDAN, boxesDAOS, boxesDACP, boxesCMSheet, binMixed, binCutsize, binFolio, binHoneycomb, binPulp, binBoxCover, binDAN, binDAOS, binDACP, binCMSheet) {
            
            var hasMixed = Object.keys(boxesMixed).some(function(group) {
                return boxesMixed[group].some(function(item) {
                    return item.mixed === true;
                });
            });
            
            var hasCutsize = Object.keys(boxesCutsize).some(function(group) {
                return boxesCutsize[group].some(function(item) {
                    return item.type === "cutsize";
                });
            });

            var hasFolio = Object.keys(boxesFolio).some(function(group) {
                return boxesFolio[group].some(function(item) {
                    return item.type === "folio";
                });
            });

            var hasHoneycomb = Object.keys(boxesHoneycomb).some(function(group) {
                return boxesHoneycomb[group].some(function(item) {
                    return item.type === "honeycomb";
                });
            });

            var hasPulp = Object.keys(boxesPulp).some(function(group) {
                return boxesPulp[group].some(function(item) {
                    return item.type === "pulp";
                });
            });

            var hasBoxCover = Object.keys(boxesBoxCover).some(function(group) {
                return boxesBoxCover[group].some(function(item) {
                    return item.type === "box and cover";
                });
            });

            var hasDAN = Object.keys(boxesDAN).some(function(group) {
                return boxesDAN[group].some(function(item) {
                    return item.type === "double a notebook";
                });
            });

            var hasDAOS = Object.keys(boxesDAOS).some(function(group) {
                return boxesDAOS[group].some(function(item) {
                    return item.type === "double a office supply";
                });
            });

            var hasDACP = Object.keys(boxesDACP).some(function(group) {
                return boxesDACP[group].some(function(item) {
                    return item.type === "double a colour paper";
                });
            });

            var hasCMSheet = Object.keys(boxesCMSheet).some(function(group) {
                return boxesCMSheet[group].some(function(item) {
                    return item.type === "CM Sheet";
                });
            });

            if(hasMixed){
                var x = 0, y = 0, z = 0;
                var currentLayerWidth = 0; 
        
                // Logic for boxes with different weights
                var leftSideWeight = 0;
                var rightSideWeight = 0;
                var boxesThatFitOnX = [];
                var totalWidth = 0;
                var rowNumber = 0; 
                var placeOnLeft = true; 
                var occupiedHeights = [];
                var currentBox = null;

                if (Object.keys(boxesMixed).length > 1){
                    
                    var balanceWidth = binMixed.width;
                    var balanceLength = binMixed.length;
                    var balanceHeight = binMixed.height;
                    var balanceWeight = binMixed.maxWeight * 1000;
                
                    Object.keys(boxesMixed).forEach(function (parent) {
                        var items = boxesMixed[parent];
                        
                        // **Sort items by volume (Largest First)**
                        items.sort(function (a, b) {
                            return (b.width * b.length * b.height) - (a.width * a.length * a.height);
                        });
                    
                        // **Initialize variables for tracking the best optimized box**
                        var bestBox = null;
                        var bestOptimizationScore = null;
                        
                        items.forEach(function (box) {
                            // if (box.type === 'mixed') {

                                if(box.type === 'Copy Paper'){
                                    box.type = 'Cutsize';
                                } else {
                                    box.type = box.type.toLowerCase();
                                }
                                
                                log.debug('box.weight', box.weight);
                                if(box.baseUnitAbbreviation){
                                    var baseUnit = box.baseUnitAbbreviation.toLowerCase();
                                    box.weight = (box.weight * box.uomConversionRates[baseUnit]) / box.uomConversionRates.ton;
                                    box.maxWeightTon = box.weight;
                                }
                                log.debug('box.weight', box.weight);
                                log.debug('baseUnit', box.baseUnitAbbreviation.toLowerCase());
                                log.debug('box.maxWeightTon', box.maxWeightTon);

                                // **Step 1: Compute Required Values**
                                var areaOfContainer = balanceWidth * balanceLength;
                                var volumeOfContainer = balanceWidth * balanceLength * balanceHeight;
                                var areaOfPallet = box.width * box.length;
                                var volumeOfPallet = box.width * box.length * box.height;
                    
                                // **Check if Box Fits**
                                log.debug('box.width <= balanceWidth', box.width <= balanceWidth);
                                log.debug('box.length <= balanceLength', box.length <= balanceLength);
                                log.debug('box.height <= balanceHeight', box.height <= balanceHeight);
                                if (box.width <= balanceWidth && box.length <= balanceLength && box.height <= balanceHeight) {
                                    var palletsPerLayer = Math.floor((binMixed.width * binMixed.length) / (box.width * box.length)) || 1;
                                    var palletsPerContainer = Math.floor(box.weight / (box.netWeightPerPallet / 1000)) || 1;
                                    log.debug('Math.floor(box.weight / (box.netWeightPerPallet / 1000))', Math.floor(box.weight / (box.netWeightPerPallet / 1000)));
                                    log.debug('palletspercontainer', palletsPerContainer);
                                    var palletNetWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                                    var netWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                                    var grossWeight = (box.grossWeightPerPallet / 1000) * palletsPerContainer;
                                    var decimalGrossWeight = palletNetWeight + grossWeight;
                                    var weight = Math.floor(decimalGrossWeight - palletNetWeight);
                                    var layer = palletsPerContainer / palletsPerLayer || 1;
                                    var maxLayers = Math.floor(balanceHeight / box.height);
                                    var noOfPallets = Math.floor(box.weight / (box.netWeightPerPallet / 1000)) || 1;
                                    var noOfContainers = noOfPallets / palletsPerContainer || 1;
                                    var reamsPerContainer = Math.floor(palletsPerContainer * (box.netWeightPerPallet / box.uomConversionRates.ream));
                                    var boxesPerContainer = Math.floor((box.weight * 1000) / box.uomConversionRates.box);
        
                                    // **Step 2: Calculate optimization score**
                                    var areaUtilization = areaOfPallet / areaOfContainer;
                                    var volumeUtilization = volumeOfPallet / volumeOfContainer;
                                    var weightUtilization = grossWeight / (binMixed.maxWeight || 1);
                    
                                    var optimizationScore = (areaUtilization) + (volumeUtilization) + (weightUtilization) + (palletsPerLayer);
                    
                                    // **Step 3: Select the best box**
                                    if (optimizationScore > bestOptimizationScore) {
                                        bestOptimizationScore = optimizationScore;
                                        bestBox = box;
                                    }
                                } else {
                                    log.debug("Skipping box (does not fit)", box.product);
                                }
                            // }
                        });
                    
                        // **Step 4: Push the selected best box to containerListMixed**
                        if (bestBox) {
                            
                            var palletsPerLayer = Math.floor((binMixed.width * binMixed.length) / (bestBox.width * bestBox.length)) || 1;
                            var palletsPerContainer = Math.floor(bestBox.weight / (bestBox.netWeightPerPallet / 1000)) || 1;
                            var palletNetWeight = (bestBox.netWeightPerPallet / 1000) * palletsPerContainer;
                            var netWeight = (bestBox.netWeightPerPallet / 1000) * palletsPerContainer;
                            var grossWeight = (bestBox.grossWeightPerPallet / 1000) * palletsPerContainer;

                            var decimalGrossWeight = palletNetWeight + grossWeight;
                            var weight = Math.floor(decimalGrossWeight - palletNetWeight);
                            var layer = palletsPerContainer / palletsPerLayer || 1;
                            var maxLayers = binMixed.height / bestBox.height;
                            var noOfPallets = Math.floor(bestBox.weight / (bestBox.netWeightPerPallet / 1000)) || 1;
                            var noOfContainers = noOfPallets / palletsPerContainer || 1;
                            var reamsPerContainer = Math.round(palletsPerContainer * (bestBox.netWeightPerPallet / bestBox.uomConversionRates.ream));
                            var boxesPerContainer = Math.floor((bestBox.weight * 1000) / bestBox.uomConversionRates.box);
                            
                            if (binMixed.size === '20'){
                                if (palletsPerContainer > 24){
                                    palletsPerContainer = 24;
                                }
                            }
                            
                            if(palletsPerLayer > palletsPerContainer){
                                palletsPerLayer = palletsPerContainer;
                            }

                            containerListMixed.push({
                                parent: parent,
                                type: bestBox.type,
                                product: bestBox.product,
                                internalId: bestBox.internalId,
                                displayName: bestBox.displayName,
                                weight: bestBox.weight,
                                maxWeightTon: bestBox.maxWeightTon,
                                layer: layer,
                                netWeight: netWeight,
                                grossWeight: grossWeight,
                                reamsPerContainer: reamsPerContainer,
                                boxesPerContainer: boxesPerContainer,
                                noOfPallets: noOfPallets,
                                palletsPerContainer: palletsPerContainer,
                                palletsPerLayer: palletsPerLayer,
                                productLayer: bestBox.layer
                            });

                            log.debug('noOfPallets', noOfPallets);
                            // **Step 5: Store Data for This Item in `boxesMixed3D`**
                            for (var i = 0; i < noOfPallets; i++) {
                                boxesMixed3D.push({
                                    parent: parent,
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
                                    maxWeightTon: bestBox.maxWeightTon,
                                    netWeightPerPallet: bestBox.netWeightPerPallet,
                                    grossWeightPerPallet: bestBox.grossWeightPerPallet,
                                    reamsPerContainer: reamsPerContainer,
                                    boxesPerContainer: boxesPerContainer,
                                    netWeight: netWeight,
                                    grossWeight: grossWeight,
                                    palletsPerContainer: palletsPerContainer,
                                    palletsPerLayer: palletsPerLayer,
                                    maxLayers: maxLayers,
                                    noOfPallets: noOfPallets,
                                    noOfContainers: noOfContainers
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
                    });
                    
                } else {
                    Object.keys(boxesMixed).forEach(function (parent) {
                        var items = boxesMixed[parent];
                    
                        // Sort items by volume (Largest First)
                        items.sort(function (a, b) {
                            return (b.width * b.length * b.height) - (a.width * a.length * a.height);
                        });
                    
                        var totalNetWeightPerPallet = 0;
                        items.forEach(function (box) {
                            // if (box.type === 'mixed') {
                                totalNetWeightPerPallet += box.netWeightPerPallet;
                            // }
                        });
                    
                        items.forEach(function (box) {
                            // if (box.type === 'mixed') {

                                if(box.type === 'Copy Paper'){
                                    box.type = 'Cutsize';
                                } else {
                                    box.type = box.type.toLowerCase();
                                }

                                if(box.baseUnitAbbreviation){
                                    var baseUnit = box.baseUnitAbbreviation.toLowerCase();
                                    box.weight = (box.weight * box.uomConversionRates[baseUnit]) / box.uomConversionRates.ton;
                                    box.maxWeightTon = box.weight;
                                }

                                var totalWeight = 0;
                                var palletsPerContainer = Math.floor((box.weight * 1000) / totalNetWeightPerPallet);
                                var noOfPallets = Math.floor((box.weight * 1000) / totalNetWeightPerPallet);
                                var palletsPerLayer = Math.floor((binMixed.width * binMixed.length) / (box.width * box.length)) || 1;
                                var palletNetWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                                var grossWeight = (box.grossWeightPerPallet / 1000) * palletsPerContainer;
                                var netWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                                var maxLayers = Math.floor(binMixed.height / box.height);
                                var noOfContainers = noOfPallets / palletsPerContainer || 1;
                                var decimalGrossWeight = palletNetWeight + grossWeight;
                                var weight = Math.floor(decimalGrossWeight - palletNetWeight);
                                var reamsPerContainer = Math.floor(palletsPerContainer * (box.netWeightPerPallet / box.uomConversionRates.ream));
                                var boxesPerContainer = Math.floor(palletsPerContainer * (box.netWeightPerPallet / box.uomConversionRates.box));

                                // Calculate the total weight of all items
                                totalWeight += box.weight;
                                var recommendedWeight = Math.max(0, box.maxWeightTon - totalWeight);
                                
                                totalNetWeightPerContainer += netWeight;

                                if (totalNetWeightPerContainer < 22 || totalNetWeightPerContainer > 23.578){
                                    totalNetWeightPerContainer = 23.578;
                                }
                                
                                if (binMixed.size === '20'){
                                    if (palletsPerContainer > 24){
                                        palletsPerContainer = 24;
                                        netWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                                    }
                                }

                                if (palletsPerLayer > palletsPerContainer) {
                                    palletsPerLayer = palletsPerContainer;
                                }
                    
                                // List recommended items if recommendedWeight > 0
                                var recommendedItems = {};

                                if (recommendedWeight > 0) {
                                    box.itemRecommendation.forEach(function (item) {
                                        var maxQuantity = Math.floor((recommendedWeight * 1000) / item.netWeightperPallet);
                                        var maxLayers = Math.floor(binMixed.height / item.height);
                                        var layerKey = item.layer; // Use the item's layer as the key

                                        if (maxQuantity > 0 && maxLayers > 0) {
                                            if (!recommendedItems[layerKey]) {
                                                recommendedItems[layerKey] = {
                                                    layer: layerKey,
                                                    maxQuantity: maxQuantity,
                                                    maxLayers: maxLayers,
                                                    length: item.length,
                                                    width: item.width,
                                                    height: item.height,
                                                };
                                            }
                                        }
                                    });

                                    // Convert object to array
                                    recommendedItems = Object.values(recommendedItems);
                                }
                                
                                var sortedRecommendedItems = null;
                                if(box.itemRecommendation){

                                    var sortedRecommendedItems = box.itemRecommendation.sort(function (a, b) {
                                        var aPriority = a.name.toLowerCase().includes("double a") ? 1 : 0;
                                        var bPriority = b.name.toLowerCase().includes("double a") ? 1 : 0;
                                    
                                        if (bPriority !== aPriority) {
                                            return bPriority - aPriority; // Prioritize Double A items first
                                        }
                                        return (b.length * b.width * b.height) - (a.length * a.width * a.height); // Sort by best fit
                                    });
                                    
                                    // Keep only the top 3-5 tightest fitting recommendations
                                    sortedRecommendedItems = sortedRecommendedItems.slice(0, 5);
                                    
                                }

                                // Push all items to containerListMixed
                                containerListMixed.push({
                                    parent: parent,
                                    type: box.type,
                                    product: box.product,
                                    internalId: box.internalId,
                                    displayName: box.displayName,
                                    weight: box.weight,
                                    maxWeightTon: box.maxWeightTon,
                                    grossWeight: grossWeight,
                                    netWeight: netWeight,
                                    reamsPerContainer: reamsPerContainer,
                                    noOfPallets: palletsPerContainer,
                                    palletsPerContainer: palletsPerContainer,
                                    palletsPerLayer: palletsPerLayer,
                                    productLayer: box.layer,
                                    boxesPerContainer: boxesPerContainer,
                                    recommendedItems: recommendedItems,
                                    sortedRecommendedItems: sortedRecommendedItems
                                });
                    
                                // Store all items in boxesMixed3D
                                for (var i = 0; i < palletsPerContainer; i++) {
                                    boxesMixed3D.push({
                                        parent: parent,
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
                                        maxWeightTon: box.maxWeightTon,
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
                            // }
                        });
                    });
                    
                }
                
                log.debug('boxesMixed3D', boxesMixed3D);
                var remainingBoxes = null;
                var colorMap = {};
                var totPalletsPerLayer = 0;
                boxesMixed3D.forEach(function (box, boxIndex) {

                    // if(box.type == 'mixed'){

                        // 3D Start
                        // var currentLayerColor = colors[layerCountMixed % colors.length]; 

                        // Assign a unique color per item
                        if (!colorMap[box.product]) {
                            colorMap[box.product] = colors[Object.keys(colorMap).length % colors.length];
                        }
                        var currentItemColor = colorMap[box.product]; // Get the color for the current item

                        var rotations = generateLogicalRotations(box); 
                        var bestFitRotation = null;
                        var bestFitWithShorterWidth = null;
                        var bestFitWithLongerWidth = null;
                        var positionKey = x + ',' + z; // Create the key as 'x,z'
                        var occupiedHeightAtPosition = occupiedHeights[positionKey] || 0; // Get the occupied height at (x, z), or 0 if none
                        // Set the initial benchmark using the first box rotation
                        var firstRotation = rotations[0];
                        var initialRemainingDimensions = {
                            remainingLength: binMixed.length - z,
                            remainingWidth: binMixed.width - x,
                            remainingHeight: binMixed.height - y
                        };
            
                        var initialRemainingVolume = initialRemainingDimensions.remainingLength * initialRemainingDimensions.remainingWidth * initialRemainingDimensions.remainingHeight;
            
                        // Initialize the best fit with the first rotation
                        if (canFit(initialRemainingDimensions, firstRotation)) {
                            bestFitRotation = firstRotation; // Set the first rotation as the initial best fit
                        }

                        // Define current position for each box before checking its fit
                        var currentPosition = {
                            remainingLength: binMixed.length - z,
                            remainingWidth: binMixed.width - totalWidth,  
                            remainingHeight: binMixed.height - y
                        };
                    
                        // Variables to hold the best fits
                        var bestFitWithShorterWidth = null;
                        var bestFitWithLongerWidth = null;
                    
                        // Check each box rotation for fit
                        rotations.forEach(function(rotatedBox) {
                            // Check if the current rotation can fit
                            if (canFit(currentPosition, rotatedBox)) {
                            
                                remainingBoxes = boxesMixed3D.slice(boxIndex + 1);
                                var isLastBox = remainingBoxes.length === 0;

                                // Prioritize boxes with LONGER WIDTH than LENGTH
                                if (rotatedBox.width > rotatedBox.length && totalWidth + rotatedBox.width <= binMixed.width) {
                                    if (!bestFitWithLongerWidth || rotatedBox.weight < bestFitWithLongerWidth.weight) {
                                        bestFitWithLongerWidth = rotatedBox;
                                    }
                                } 
                                // Otherwise, consider using a shorter width for the last box scenario
                                else if (totalWidth + rotatedBox.length <= binMixed.width) {
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
                    
                        if(boxesThatFitOnX.length > 0){
                            bestFitRotation = boxesThatFitOnX[0];
                        }

                        // Distribute boxes along the x-axis row by alternating placement between front and back sides
                        boxesThatFitOnX.forEach(function(fittedBox, index) {
                            // Determine if we are on an even or odd row (rowNumber tracks rows)
                            var isEvenRow = rowNumber % 2 === 0; // Even rows start from front (left), odd rows from back (right)
                    
                            // Alternate between front and back placement
                            var placeOnFront = (isEvenRow && placeOnLeft) || (!isEvenRow && !placeOnLeft);
                            var sideToPlace = placeOnFront ? 'left' : 'right';
                    
                            // Place the box based on whether it's on the left (front) or right (back)
                            var xOffset = sideToPlace === 'left' ? totalWidth : binMixed.width - (totalWidth + fittedBox.width);
                    
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
                        
                            if (occupiedHeightAtPosition + bestFitRotation.height <= binMixed.height) {
                                palletsPerLayerMixed++;
                        
                                if (!heightMap[positionKey]) {
                                    heightMap[positionKey] = occupiedHeightAtPosition + bestFitRotation.height;
                                } else {
                                    heightMap[positionKey] = Math.max(heightMap[positionKey], occupiedHeightAtPosition + bestFitRotation.height);
                                }
                        
                                var minOccupiedHeight = Math.min.apply(null, Object.values(heightMap)) || 0;
                                var remainingHeight = binMixed.height - minOccupiedHeight;
                        
                                totPalletsPerLayer++;
                        
                                packedBoxesMixed.push({
                                    x: x,
                                    y: occupiedHeightAtPosition,
                                    z: z,
                                    originalDimensions: box,
                                    box: bestFitRotation,
                                    color: currentItemColor,
                                    remainingDimensions: {
                                        remainingLength: binMixed.length - z,
                                        remainingWidth: binMixed.width - x,
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
                                
                                grandTotalMixed += bestFitRotation.price;
                                x += bestFitRotation.width;
                        
                                if (x + bestFitRotation.width > binMixed.width) {
                                    x = 0;
                                    z += bestFitRotation.length;
                                }
                        
                                var layers = parseInt(bestFitRotation.layer.slice(0, -1));

                                if (z + bestFitRotation.length > binMixed.length) {
                                    if (layerCountMixed + 1 < layers) {
                                        z = 0;
                                        y += bestFitRotation.height;
                                        itemsPerLayerMixed.push(totPalletsPerLayer);
                                        totPalletsPerLayer = 0;
                                        palletsPerLayerMixed = 0;
                                        layerCountMixed++;
                                    }
                                }

                        
                                occupiedHeights[positionKey] = Math.max(occupiedHeightAtPosition, occupiedHeightAtPosition + bestFitRotation.height);
                            }
                        
                        } else {
                            log.debug('No valid box to fit:', box);
                            currentBox = box;
                        
                            allContainersMixed.push({ packedBoxes: packedBoxesMixed, containerListMixed: containerListMixed });
                        
                            x = 0;
                            y = 0;
                            z = 0;
                            packedBoxesMixed = [];
                            occupiedHeights = {};
                            heightMap = {};
                            layerCountMixed = 0;
                            palletsPerLayerMixed = 0;
                            itemsPerLayerMixed = [];
                            itemsPerLayerMixed.push(totPalletsPerLayer);
                            totPalletsPerLayer = 1;
                        
                            if (box.width < box.length) {
                                var temp = box.width;
                                box.width = box.length;
                                box.length = temp;
                            }
                        
                            if (canFit({ remainingLength: binMixed.length, remainingWidth: binMixed.width, remainingHeight: binMixed.height }, box)) {
                                packedBoxesMixed.push({
                                    x: x,
                                    y: y,
                                    z: z,
                                    originalDimensions: box,
                                    box: box,
                                    color: currentItemColor,
                                    remainingDimensions: {
                                        remainingLength: binMixed.length - box.length,
                                        remainingWidth: binMixed.width - box.width,
                                        remainingHeight: binMixed.height - box.height
                                    },
                                    type: box.type,
                                    product: box.product,
                                    internalId: box.internalId,
                                    weight: box.weight,
                                    layer: layerCountMixed,
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
                                log.debug('Placed current box in new container:', box);
                            } else {
                                log.debug('Current box still cannot fit in the new container:', box);
                            }
                        }

                    // }

                });
                
                log.debug('packedBoxesMixed', packedBoxesMixed);
                if (packedBoxesMixed.length > 0) {
                    allContainersMixed.push(
                        {
                            packedBoxes: packedBoxesMixed, 
                            containerListMixed: containerListMixed
                        });
                }

                if (totPalletsPerLayer > 0) {
                    itemsPerLayerMixed.push(totPalletsPerLayer);
                }
                
                if(balanceHeight > 0 || balanceLength > 0 || balanceWidth > 0) 
                {
                    itemRecommendation = true;
                }
            }

            if(hasCutsize){
                var x = 0, y = 0, z = 0;
                var currentLayerWidth = 0; 
        
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
                var FCLNetWeight= 0;
                var lastContainerNetWeight = 0;
                var lastContainerFCLNetWeight= 0;

                if (Object.keys(boxesCutsize).length > 1){
                    
                    var balanceWidth = binCutsize.width;
                    var balanceLength = binCutsize.length;
                    var balanceHeight = binCutsize.height;
                    var balanceWeight = binCutsize.maxWeight * 1000;
                
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

                                if(box.baseUnitAbbreviation){
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
                                    var palletsPerLayer = Math.floor((binCutsize.width * binCutsize.length) / (box.width * box.length)) || 1;
                                    var palletsPerContainer = Math.floor(box.weight / (box.netWeightPerPallet / 1000)) || 1;
                                    var palletNetWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                                    var netWeight = (box.netWeightPerPallet * palletsPerContainer) / 1000;
                                    var grossWeight = (box.grossWeightPerPallet / 1000) * palletsPerContainer;
                                    var decimalGrossWeight = palletNetWeight + grossWeight;
                                    var weight = Math.floor(decimalGrossWeight - palletNetWeight);
                                    var layer = palletsPerContainer / palletsPerLayer || 1;
                                    var maxLayers = Math.floor(balanceHeight / box.height);
                                    var noOfPallets = Math.floor(box.weight / (box.netWeightPerPallet / 1000)) || 1;
                                    var noOfContainers = noOfPallets / palletsPerContainer || 1;
                                    var reamsPerContainer = Math.floor(palletsPerContainer * (box.netWeightPerPallet / box.uomConversionRates.ream));
                                    var boxesPerContainer = Math.floor((box.weight * 1000) / box.uomConversionRates.box);
        
                                    // **Step 2: Calculate optimization score**
                                    var areaUtilization = areaOfPallet / areaOfContainer;
                                    var volumeUtilization = volumeOfPallet / volumeOfContainer;
                                    var weightUtilization = grossWeight / (binCutsize.maxWeight || 1);
                    
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
                    
                        log.debug('bestbox', bestBox);
                        // **Step 4: Push the selected best box to containerListCutsize**
                        if (bestBox) {
                            
                            var palletsPerLayer = Math.floor((binCutsize.width * binCutsize.length) / (bestBox.width * bestBox.length)) || 1;
                            var palletsPerContainer = Math.floor(bestBox.weight / (bestBox.netWeightPerPallet / 1000)) || 1;
                            var palletNetWeight = (bestBox.netWeightPerPallet / 1000) * palletsPerContainer;
                            var netWeight = (bestBox.netWeightPerPallet * palletsPerContainer) / 1000;
                            var grossWeight = (bestBox.grossWeightPerPallet / 1000) * palletsPerContainer;

                            var decimalGrossWeight = palletNetWeight + grossWeight;
                            var weight = Math.floor(decimalGrossWeight - palletNetWeight);
                            var layer = palletsPerContainer / palletsPerLayer || 1;
                            var maxLayers = binCutsize.height / bestBox.height;
                            var noOfPallets = Math.floor(bestBox.weight / (bestBox.netWeightPerPallet / 1000)) || 1;
                            var noOfContainers = noOfPallets / palletsPerContainer || 1;
                            var reamsPerContainer = Math.round(palletsPerContainer * (bestBox.netWeightPerPallet / bestBox.uomConversionRates.ream));
                            var boxesPerContainer = Math.floor((bestBox.weight * 1000) / bestBox.uomConversionRates.box);
                            
                            // Calculate the total weight of all items
                            // totalWeight += box.weight;
                            // var recommendedWeight = Math.max(0, box.maxWeightTon - totalWeight);
                            
                            totalNetWeightPerContainer += netWeight;

                            if (noOfPallets < 1 && totalNetWeightPerContainer > 0){
                                itemRecommendation = true;

                                totalWeight = 0;
                                palletsPerContainer = (box.weight * 1000) / totalNetWeightPerPallet;
                                noOfPallets = (box.weight * 1000) / totalNetWeightPerPallet;
                                palletsPerLayer = (binCutsize.width * binCutsize.length) / (box.width * box.length) || 1;
                                palletNetWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                                grossWeight = (box.grossWeightPerPallet / 1000) * palletsPerContainer;
                                netWeight = (box.netWeightPerPallet * palletsPerContainer) / 1000;
                                maxLayers = binCutsize.height / box.height;
                                noOfContainers = noOfPallets / palletsPerContainer || 1;
                                decimalGrossWeight = palletNetWeight + grossWeight;
                                weight = decimalGrossWeight - palletNetWeight;
                                reamsPerContainer = palletsPerContainer * (box.netWeightPerPallet / box.uomConversionRates.ream);
                                boxesPerContainer = (weight * 1000) / box.uomConversionRates.box;
                            }

                            if (binCutsize.size === '20'){
                                if (palletsPerContainer > 24){
                                    palletsPerContainer = 24;
                                }
                            }
                            
                            if(palletsPerLayer > palletsPerContainer){
                                palletsPerLayer = palletsPerContainer;
                            }

                            // List recommended items if recommendedWeight > 0
                            // var recommendedItems = {};

                            // if (recommendedWeight > 0) {
                            //     box.itemRecommendation.forEach(function (item) {
                            //         var maxQuantity = Math.floor((recommendedWeight * 1000) / item.netWeightperPallet);
                            //         var maxLayers = Math.floor(binCutsize.height / item.height);
                            //         var layerKey = item.layer; // Use the item's layer as the key

                            //         if (maxQuantity > 0 && maxLayers > 0) {
                            //             if (!recommendedItems[layerKey]) {
                            //                 recommendedItems[layerKey] = {
                            //                     layer: layerKey,
                            //                     maxQuantity: maxQuantity,
                            //                     maxLayers: maxLayers,
                            //                     length: item.length,
                            //                     width: item.width,
                            //                     height: item.height,
                            //                 };
                            //             }
                            //         }
                            //     });

                            //     // Convert object to array
                            //     recommendedItems = Object.values(recommendedItems);
                            // }

                            // var sortedRecommendedItems = null;
                            // if(box.itemRecommendation){

                            //     var sortedRecommendedItems = box.itemRecommendation.sort(function (a, b) {
                            //         var aPriority = a.name.toLowerCase().includes("double a") ? 1 : 0;
                            //         var bPriority = b.name.toLowerCase().includes("double a") ? 1 : 0;
                                
                            //         if (bPriority !== aPriority) {
                            //             return bPriority - aPriority; // Prioritize Double A items first
                            //         }
                            //         return (b.length * b.width * b.height) - (a.length * a.width * a.height); // Sort by best fit
                            //     });
                                
                            //     // Keep only the top 3-5 tightest fitting recommendations
                            //     sortedRecommendedItems = sortedRecommendedItems.slice(0, 5);
                                
                            // }

                            // containerListCutsize.push({
                            //     parent: parent,
                            //     type: bestBox.type,
                            //     product: bestBox.product,
                            //     internalId: bestBox.internalId,
                            //     displayName: bestBox.displayName,
                            //     weight: bestBox.weight,
                            //     maxWeightTon: bestBox.maxWeightTon,
                            //     layer: layer,
                            //     netWeight: netWeight,
                            //     grossWeight: grossWeight,
                            //     reamsPerContainer: reamsPerContainer,
                            //     boxesPerContainer: boxesPerContainer,
                            //     noOfPallets: noOfPallets,
                            //     palletsPerContainer: palletsPerContainer,
                            //     palletsPerLayer: palletsPerLayer,
                            //     productLayer: bestBox.layer
                            // });

                            // // **Step 5: Store Data for This Item in `boxesCutsize3D`**
                            // for (var i = 0; i < noOfPallets; i++) {
                            //     boxesCutsize3D.push({
                            //         parent: parent,
                            //         documentNo: bestBox.documentNo,
                            //         type: bestBox.type,
                            //         product: bestBox.product,
                            //         internalId: bestBox.internalId,
                            //         displayName: bestBox.displayName,
                            //         pallet: "true",
                            //         layer: bestBox.layer,
                            //         length: bestBox.length,
                            //         width: bestBox.width,
                            //         height: bestBox.height,
                            //         weight: bestBox.weight,
                            //         maxWeightTon: bestBox.maxWeightTon,
                            //         netWeightPerPallet: bestBox.netWeightPerPallet,
                            //         grossWeightPerPallet: bestBox.grossWeightPerPallet,
                            //         reamsPerContainer: reamsPerContainer,
                            //         boxesPerContainer: boxesPerContainer,
                            //         netWeight: netWeight,
                            //         grossWeight: grossWeight,
                            //         palletsPerContainer: palletsPerContainer,
                            //         palletsPerLayer: palletsPerLayer,
                            //         maxLayers: maxLayers,
                            //         noOfPallets: noOfPallets,
                            //         noOfContainers: noOfContainers
                            //     });
                            // }

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
                                maxWeightTon: binCutsize.maxWeight,
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
                                    maxWeightTon: binCutsize.maxWeight,
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
                                log.debug('box.netWeightPerPallet', box.netWeightPerPallet);
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

                                if (!binCutsize.maxWeight || binCutsize.maxWeight === 0) {
                                    // No max weight defined → assume unlimited
                                    binCutsize.maxWeight = Infinity; 
                                }
                                

                                log.debug('totalNetWeightPerPallet', totalNetWeightPerPallet);
                                log.debug('tempTotalPallets', tempTotalPallets);
                                if (tempTotalPallets <= binCutsize.maxWeight) {
                                    // ✅ Safe to add
                                    totalPalletsPerContainer = tempTotalPallets;

                                    var noOfPallets = palletsPerContainer;
                                    var palletsPerLayer = Math.floor((binCutsize.width * binCutsize.length) / (box.width * box.length)) || 1;
                                    var palletNetWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                                    var grossWeight = (box.grossWeightPerPallet / 1000) * palletsPerContainer;
                                    var netWeight = (box.netWeightPerPallet * palletsPerContainer) / 1000;
                                    var maxLayers = Math.floor(binCutsize.height / box.height);
                                    var noOfContainers = noOfPallets / palletsPerContainer || 1;
                                    var decimalGrossWeight = palletNetWeight + grossWeight;
                                    var weight = Math.floor(decimalGrossWeight - palletNetWeight);
                                    var reamsPerContainer = Math.floor(palletsPerContainer * (box.netWeightPerPallet / box.uomConversionRates.ream));
                                    var boxesPerContainer = Math.floor((weight * 1000) / box.uomConversionRates.carton);
                    
                                    totalWeight += box.weight;
                                    totalNetWeightPerContainer += netWeight;

                                    if (noOfPallets < 1 && totalNetWeightPerContainer > 0) {
                                        itemRecommendation = true;

                                        totalWeight = 0;
                                        palletsPerContainer = (box.weight * 1000) / totalNetWeightPerPallet;
                                        noOfPallets = palletsPerContainer;
                                        palletsPerLayer = (binCutsize.width * binCutsize.length) / (box.width * box.length) || 1;
                                        palletNetWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                                        grossWeight = (box.grossWeightPerPallet / 1000) * palletsPerContainer;
                                        netWeight = (box.netWeightPerPallet * palletsPerContainer) / 1000;
                                        maxLayers = binCutsize.height / box.height;
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
                                        maxWeightTon: binCutsize.maxWeight,
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
                                            maxWeightTon: binCutsize.maxWeight,
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
                                    
                                    log.debug('palletspercontainer push 1', palletsPerContainer);
                                    if (Number(palletsPerContainer) === Number(binCutsize.maxWeight)) {
                                        containerFull = true;
                                    }
                                    
                                } else {
                                    
                                    log.debug('containerFull', containerFull);
                                    if (palletsPerContainer > 0 && containerFull === false) {
                                        // ⚠️ Exceeds maxWeight, reduce box.weight step by step
                                        while (palletsPerContainer > 0 && (totalPalletsPerContainer + palletsPerContainer) > binCutsize.maxWeight) {
                                            box.weight -= 1; // reduce 1 unit
                                            palletsPerContainer = Math.floor((box.weight * 1000) / totalNetWeightPerPallet);
                                        }
                                        
                                        // ✅ After adjustment, fit into current container
                                        totalPalletsPerContainer += palletsPerContainer;
                                    
                                        // If we reduced weight, calculate balance that should go to next container
                                        balanceWeight = tempTotalPallets - totalPalletsPerContainer;

                                        var noOfPallets = palletsPerContainer;
                                        var palletsPerLayer = Math.floor((binCutsize.width * binCutsize.length) / (box.width * box.length)) || 1;
                                        var palletNetWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                                        var grossWeight = (box.grossWeightPerPallet / 1000) * palletsPerContainer;
                                        var netWeight = (box.netWeightPerPallet * palletsPerContainer) / 1000;
                                        var maxLayers = Math.floor(binCutsize.height / box.height);
                                        var noOfContainers = noOfPallets / palletsPerContainer || 1;
                                        var decimalGrossWeight = palletNetWeight + grossWeight;
                                        var weight = Math.floor(decimalGrossWeight - palletNetWeight);
                                        var reamsPerContainer = Math.floor(palletsPerContainer * (box.netWeightPerPallet / box.uomConversionRates.ream));
                                        var boxesPerContainer = Math.floor((weight * 1000) / box.uomConversionRates.carton);

                                        totalWeight += box.weight;
                                        totalNetWeightPerContainer += netWeight;

                                        if (noOfPallets < 1 && totalNetWeightPerContainer > 0) {
                                            itemRecommendation = true;

                                            totalWeight = 0;
                                            palletsPerContainer = (box.weight * 1000) / totalNetWeightPerPallet;
                                            noOfPallets = palletsPerContainer;
                                            palletsPerLayer = (binCutsize.width * binCutsize.length) / (box.width * box.length) || 1;
                                            palletNetWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                                            grossWeight = (box.grossWeightPerPallet / 1000) * palletsPerContainer;
                                            netWeight = (box.netWeightPerPallet * palletsPerContainer) / 1000;
                                            maxLayers = binCutsize.height / box.height;
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
                                            maxWeightTon: binCutsize.maxWeight,
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

                                        log.debug('palletspercontainer push 2', palletsPerContainer);
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
                                                maxWeightTon: binCutsize.maxWeight,
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

                                        allRecordCutsize.push({ boxesCutsize3D: boxesCutsize3D, containerListCutsize: containerListCutsize });
                                        
                                        // Create a new box object for the remaining weight
                                        palletsPerContainer = balanceWeight;
                                        containerIndex++;

                                        var noOfPallets = palletsPerContainer;
                                        var palletsPerLayer = Math.floor((binCutsize.width * binCutsize.length) / (box.width * box.length)) || 1;
                                        var palletNetWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                                        var grossWeight = (box.grossWeightPerPallet / 1000) * palletsPerContainer;
                                        var netWeight = (box.netWeightPerPallet * palletsPerContainer) / 1000;
                                        var maxLayers = Math.floor(binCutsize.height / box.height);
                                        var noOfContainers = noOfPallets / palletsPerContainer || 1;
                                        var decimalGrossWeight = palletNetWeight + grossWeight;
                                        var weight = Math.floor(decimalGrossWeight - palletNetWeight);
                                        var reamsPerContainer = Math.floor(palletsPerContainer * (box.netWeightPerPallet / box.uomConversionRates.ream));
                                        var boxesPerContainer = Math.floor((weight * 1000) / box.uomConversionRates.carton);

                                        totalWeight += box.weight;
                                        totalNetWeightPerContainer += netWeight;
                                        lastContainerNetWeight = netWeight;
                                        lastContainerFCLNetWeight = (((binCutsize.maxWeight / items.length) * netWeight) / 1000).toFixed(3);
                                        log.debug('totalNetWeightPerContainerxxx', totalNetWeightPerContainer);
                                        log.debug('lastContainerFCLNetWeight', lastContainerFCLNetWeight);
                                        
                                        if (noOfPallets < 1 && totalNetWeightPerContainer > 0) {
                                            itemRecommendation = true;

                                            totalWeight = 0;
                                            palletsPerContainer = (box.weight * 1000) / totalNetWeightPerPallet;
                                            noOfPallets = palletsPerContainer;
                                            palletsPerLayer = (binCutsize.width * binCutsize.length) / (box.width * box.length) || 1;
                                            palletNetWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                                            grossWeight = (box.grossWeightPerPallet / 1000) * palletsPerContainer;
                                            netWeight = (box.netWeightPerPallet * palletsPerContainer) / 1000;
                                            maxLayers = binCutsize.height / box.height;
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
                                            maxWeightTon: binCutsize.maxWeight,
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
                                        log.debug('palletspercontainer push 3', palletsPerContainer);
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
                                                maxWeightTon: binCutsize.maxWeight,
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
                                    else {

                                        allRecordCutsize.push({ boxesCutsize3D: boxesCutsize3D, containerListCutsize: containerListCutsize });
                                    
                                        palletsPerContainer = box.weight; // all remaining weight
                                        containerIndex++;

                                        var noOfPallets = palletsPerContainer;
                                        var palletsPerLayer = Math.floor((binCutsize.width * binCutsize.length) / (box.width * box.length)) || 1;
                                        var palletNetWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                                        var grossWeight = (box.grossWeightPerPallet / 1000) * palletsPerContainer;
                                        var netWeight = (box.netWeightPerPallet * palletsPerContainer) / 1000;
                                        var maxLayers = Math.floor(binCutsize.height / box.height);
                                        var noOfContainers = noOfPallets / palletsPerContainer || 1;
                                        var decimalGrossWeight = palletNetWeight + grossWeight;
                                        var weight = Math.floor(decimalGrossWeight - palletNetWeight);
                                        var reamsPerContainer = Math.floor(palletsPerContainer * (box.netWeightPerPallet / box.uomConversionRates.ream));
                                        var boxesPerContainer = Math.floor((weight * 1000) / box.uomConversionRates.carton);

                                        totalWeight += box.weight;
                                        totalNetWeightPerContainer += netWeight;
                                        lastContainerNetWeight = netWeight;

                                        if (noOfPallets < 1 && totalNetWeightPerContainer > 0) {
                                            itemRecommendation = true;

                                            totalWeight = 0;
                                            palletsPerContainer = (box.weight * 1000) / totalNetWeightPerPallet;
                                            noOfPallets = palletsPerContainer;
                                            palletsPerLayer = (binCutsize.width * binCutsize.length) / (box.width * box.length) || 1;
                                            palletNetWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                                            grossWeight = (box.grossWeightPerPallet / 1000) * palletsPerContainer;
                                            netWeight = (box.netWeightPerPallet * palletsPerContainer) / 1000;
                                            maxLayers = binCutsize.height / box.height;
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
                                            maxWeightTon: binCutsize.maxWeight,
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
                                                maxWeightTon: binCutsize.maxWeight,
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

                        log.debug('containerindex', containerIndex);
                        if (binCutsize.maxWeight !== Infinity){
                            FCLNetWeight = ((((binCutsize.maxWeight / items.length) * containerIndex) * totalNetWeightPerPallet) / 1000).toFixed(3);
                        } else {
                            FCLNetWeight = ((((InputQty / items.length) * containerIndex) * totalNetWeightPerPallet) / 1000).toFixed(3);
                        }

                        var minTolerance = FCLNetWeight * (lowerBound / 100);
                        var maxTolerance = FCLNetWeight * (upperBound / 100);
                        
                        log.debug('items.length', items.length);
                        log.debug('min tolerance', minTolerance);
                        log.debug('max tolerance', maxTolerance);
                        log.debug('InputQty', InputQty);
                        log.debug('FCLNetWeight', FCLNetWeight);
                        log.debug('lastcontainernetweight', lastContainerNetWeight);
                        log.debug('grandNetWeightPallet', grandNetWeightPallet);
                        if (InputQty >= minTolerance && InputQty <= maxTolerance && binCutsize.maxWeight !== Infinity){
                            
                            itemRecommendation = true;

                            if (InputQty < FCLNetWeight){

                                log.debug('within range & need to add more');
                                action = 'increase';
                                totalBalanceWeight = (FCLNetWeight - InputQty).toFixed(3);

                            } else {

                                log.debug('within range & need to reduce qty');
                                action = 'reduce';
                                totalBalanceWeight = (InputQty - FCLNetWeight).toFixed(3);
                            }

                        } else if (InputQty < minTolerance){

                            log.debug('add more');
                            action = 'increase';
                            
                            itemRecommendation = true;
                            totalBalanceWeight = (FCLNetWeight - InputQty).toFixed(3);

                        } else if (InputQty >= maxTolerance){
                            
                            itemRecommendation = true;

                            if (lastContainerNetWeight){
                                
                                log.debug('new container & add more if not yet FCL');
                                action = 'increase';
                                totalBalanceWeight = (FCLNetWeight - lastContainerNetWeight).toFixed(3);
                                
                            } else {

                                log.debug('reduce qty');
                                action = 'reduce';
                                if (grandNetWeightPallet){
                                    totalBalanceWeight = (InputQty - grandNetWeightPallet).toFixed(3);
                                }
                            }
                        } 
                        
                        log.debug('totalBalanceWeight', totalBalanceWeight);
                        // if (totalPalletsPerContainer < binCutsize.maxWeight && action && binCutsize.maxWeight !== Infinity){
                        //     itemRecommendation = true;
                        //     totalBalanceWeight = binCutsize.maxWeight - totalPalletsPerContainer;

                        // } else if ((boxesCutsize3D.length - totalPalletsPerContainer) != 0 && action && binCutsize.maxWeight !== Infinity){
                        //     itemRecommendation = true;
                        //     totalBalanceWeight = binCutsize.maxWeight - (boxesCutsize3D.length - totalPalletsPerContainer);
                        // }

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

                log.debug('boxesCutsize3D.length', boxesCutsize3D.length);
                boxesCutsize3D.forEach(function (box, boxIndex) {

                    if(box.type == 'cutsize'){

                        // 3D Start
                        // var currentLayerColor = colors[layerCountCutsize % colors.length]; 

                        // Assign a unique color per item
                        if (!colorMap[box.product]) {
                            colorMap[box.product] = colors[Object.keys(colorMap).length % colors.length];
                        }
                        var currentItemColor = colorMap[box.product]; // Get the color for the current item

                        var rotations = generateLogicalRotations(box); 
                        var bestFitRotation = null;
                        var bestFitWithShorterWidth = null;
                        var bestFitWithLongerWidth = null;
                        var positionKey = x + ',' + z; // Create the key as 'x,z'
                        var occupiedHeightAtPosition = occupiedHeights[positionKey] || 0; // Get the occupied height at (x, z), or 0 if none
                        // Set the initial benchmark using the first box rotation
                        var firstRotation = rotations[0];
                        var initialRemainingDimensions = {
                            remainingLength: binCutsize.length - z,
                            remainingWidth: binCutsize.width - x,
                            remainingHeight: binCutsize.height - y
                        };
            
                        var initialRemainingVolume = initialRemainingDimensions.remainingLength * initialRemainingDimensions.remainingWidth * initialRemainingDimensions.remainingHeight;
            
                        // Initialize the best fit with the first rotation
                        if (canFit(initialRemainingDimensions, firstRotation)) {
                            bestFitRotation = firstRotation; // Set the first rotation as the initial best fit
                        }

                        // Define current position for each box before checking its fit
                        var currentPosition = {
                            remainingLength: binCutsize.length - z,
                            remainingWidth: binCutsize.width - totalWidth,  
                            remainingHeight: binCutsize.height - y
                        };
                    
                        // Variables to hold the best fits
                        var bestFitWithShorterWidth = null;
                        var bestFitWithLongerWidth = null;
                        
                        // Check each box rotation for fit
                        rotations.forEach(function(rotatedBox) {
                            // Check if the current rotation can fit
                            if (canFit(currentPosition, rotatedBox)) {
                            
                                remainingBoxes = boxesCutsize3D.slice(boxIndex + 1);
                                var isLastBox = remainingBoxes.length === 0;

                                // Prioritize boxes with LONGER WIDTH than LENGTH
                                if (rotatedBox.width > rotatedBox.length && totalWidth + rotatedBox.width <= binCutsize.width) {
                                    if (!bestFitWithLongerWidth || rotatedBox.weight < bestFitWithLongerWidth.weight) {
                                        bestFitWithLongerWidth = rotatedBox;
                                    }
                                } 
                                // Otherwise, consider using a shorter width for the last box scenario
                                else if (totalWidth + rotatedBox.length <= binCutsize.width) {
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
                    
                        if(boxesThatFitOnX.length > 0){
                            bestFitRotation = boxesThatFitOnX[0];
                        }

                        // Distribute boxes along the x-axis row by alternating placement between front and back sides
                        boxesThatFitOnX.forEach(function(fittedBox, index) {
                            // Determine if we are on an even or odd row (rowNumber tracks rows)
                            var isEvenRow = rowNumber % 2 === 0; // Even rows start from front (left), odd rows from back (right)
                    
                            // Alternate between front and back placement
                            var placeOnFront = (isEvenRow && placeOnLeft) || (!isEvenRow && !placeOnLeft);
                            var sideToPlace = placeOnFront ? 'left' : 'right';
                    
                            // Place the box based on whether it's on the left (front) or right (back)
                            var xOffset = sideToPlace === 'left' ? totalWidth : binCutsize.width - (totalWidth + fittedBox.width);
                    
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

                            if (occupiedHeightAtPosition + bestFitRotation.height <= binCutsize.height) {
                                palletsPerLayerCutsize++;
                        
                                if (!heightMap[positionKey]) {
                                    heightMap[positionKey] = occupiedHeightAtPosition + bestFitRotation.height;
                                } else {
                                    heightMap[positionKey] = Math.max(heightMap[positionKey], occupiedHeightAtPosition + bestFitRotation.height);
                                }
                        
                                var minOccupiedHeight = Math.min.apply(null, Object.values(heightMap)) || 0;
                                var remainingHeight = binCutsize.height - minOccupiedHeight;
                        
                                totPalletsPerLayer++;
                        
                                packedBoxesCutsize.push({
                                    x: x,
                                    y: occupiedHeightAtPosition,
                                    z: z,
                                    originalDimensions: box,
                                    box: bestFitRotation,
                                    color: currentItemColor,
                                    remainingDimensions: {
                                        remainingLength: binCutsize.length - z,
                                        remainingWidth: binCutsize.width - x,
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
                        
                                if (x + bestFitRotation.width > binCutsize.width) {
                                    x = 0;
                                    z += bestFitRotation.length;
                                }
                        
                                var layers = parseInt(bestFitRotation.layer.slice(0, -1));

                                if (z + bestFitRotation.length > binCutsize.length) {
                                    if (layerCountCutsize + 1 < layers) {
                                        z = 0;
                                        y += bestFitRotation.height;
                                        itemsPerLayerCutsize.push(totPalletsPerLayer);
                                        totPalletsPerLayer = 0;
                                        palletsPerLayerCutsize = 0;
                                        layerCountCutsize++;
                                    }
                                }

                        
                                occupiedHeights[positionKey] = Math.max(occupiedHeightAtPosition, occupiedHeightAtPosition + bestFitRotation.height);
                                balanceLength = binCutsize.length - z;
                                balanceWidth = binCutsize.width - x;
                                balanceHeight = binCutsize.height - occupiedHeights[positionKey];
                            }
                        
                        } else {
                            log.debug('No valid box to fit:', box);
                            currentBox = box;
                            currentProductCount = currentProductCount;
                            
                            allContainersCutsize.push({ packedBoxes: packedBoxesCutsize, containerListCutsize: containerListCutsize });
                        
                            x = 0;
                            y = 0;
                            z = 0;
                            packedBoxesCutsize = [];
                            occupiedHeights = {};
                            heightMap = {};
                            layerCountCutsize = 0;
                            palletsPerLayerCutsize = 0;
                            itemsPerLayerCutsize = [];
                            itemsPerLayerCutsize.push(totPalletsPerLayer);
                            totPalletsPerLayer = 1;
                        
                            if (box.width < box.length) {
                                var temp = box.width;
                                box.width = box.length;
                                box.length = temp;
                            }
                        
                            if (canFit({ remainingLength: binCutsize.length, remainingWidth: binCutsize.width, remainingHeight: binCutsize.height }, box)) {
                                packedBoxesCutsize.push({
                                    x: x,
                                    y: y,
                                    z: z,
                                    originalDimensions: box,
                                    box: box,
                                    color: currentItemColor,
                                    remainingDimensions: {
                                        remainingLength: binCutsize.length - box.length,
                                        remainingWidth: binCutsize.width - box.width,
                                        remainingHeight: binCutsize.height - box.height
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
                                log.debug('Placed current box in new container:', box);
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

                if (totPalletsPerLayer > 0) {
                    itemsPerLayerCutsize.push(totPalletsPerLayer);
                }
                
            }
            
            if (hasFolio) {
                var x = 0, y = 0, z = 0; 
                var currentLayerWidth = 0;
                var leftSideWeight = 0;
                var rightSideWeight = 0;
                var boxesThatFitOnX = [];
                var totalWidth = 0;
                var rowNumber = 0;
                var placeOnLeft = true;
                var occupiedHeights = []; 
                var isFirstBox = true;
                var newZ = 0;
                var totalMaxX = 0;
            
                // Get the maximum z value for a given x position
                function getMaxZForX(x, smallestBoxWidth, currentPosition) {
                    var maxZ = 0; 
                    var totalMaxX = 0;
                
                    for (var i = 0; i < packedBoxesFolio.length; i++) {
                        var placedBox = packedBoxesFolio[i];
                        var previousPlacedBox = packedBoxesFolio[i - 1];
                
                        if (placedBox.x === 0) {
                            totalMaxX = placedBox.box.width;
                        } else {
                            totalMaxX += placedBox.box.width;
                        }
                
                        // **Condition 1: Placed at start (X = 0)**
                        if (x === 0 && placedBox.x === 0) {
                            maxZ = Math.max(maxZ, placedBox.z + placedBox.box.length);
                        
                        // **Condition 2: Box placed after another in X direction**
                        } else if (placedBox.x > 0 && placedBox.z === 0) {
                            maxZ = Math.max(maxZ, placedBox.z + placedBox.box.length);
                
                        // **Condition 3: Handling bin width limits and different box sizes**
                        } else if (placedBox.x > 0 && (totalMaxX + smallestBoxWidth > binFolio.width || 
                                (previousPlacedBox && previousPlacedBox.box.length > placedBox.box.length))) {
                            if (previousPlacedBox && previousPlacedBox.box.length > placedBox.box.length &&
                                totalMaxX + smallestBoxWidth > binFolio.width) {
                                maxZ = Math.max(maxZ, placedBox.z + previousPlacedBox.box.length);
                            } else {
                                maxZ = Math.max(maxZ, placedBox.z + placedBox.box.length);
                            }
                        }
                    }
                    return maxZ;
                }            
            
                var allBoxes = Object.values(boxesFolio).flat();

                var minWeight = Math.min.apply(null, allBoxes.map(function (box) {
                    return box.weight;
                }));

                var maxWeight = Math.max.apply(null, allBoxes.map(function (box) {
                    return box.weight;
                }));

                var smallestBoxWidth = Math.min.apply(null, allBoxes.map(function (box) {
                    return box.width;
                }));

                Object.keys(boxesFolio).forEach(function (parent) {
                    var items = boxesFolio[parent];

                    // Sort items by volume (Largest First)
                    items.sort(function (a, b) {
                        return (b.width * b.length * b.height) - (a.width * a.length * a.height);
                    });

                    var totalNetWeightPerPallet = 0;
                    items.forEach(function (box) {
                        if (box.type === 'folio') {
                            totalNetWeightPerPallet += box.netWeightPerPallet;
                        }
                    });

                    items.forEach(function (box) {
                        if (box.type === 'folio') {
                            
                            if(box.baseUnitAbbreviation){
                                var baseUnit = box.baseUnitAbbreviation.toLowerCase();
                                box.weight = (box.weight * box.uomConversionRates[baseUnit]) / box.uomConversionRates.ton;
                                box.maxWeightTon = box.weight;
                            }

                            var totalWeight = 0;
                            var palletsPerLayer = Math.floor((binFolio.width * binFolio.length) / (box.width * box.length)) || 1;
                            var palletsPerContainer = Math.floor(box.weight / (box.netWeightPerPallet / 1000)) || 1;
                            var noOfPallets = Math.floor((box.weight * 1000) / totalNetWeightPerPallet);
                            var palletNetWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                            var grossWeight = (box.grossWeightPerPallet / 1000) * palletsPerContainer;
                            var netWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                            var maxLayers = Math.floor(binFolio.height / box.height);
                            var noOfContainers = noOfPallets / palletsPerContainer || 1;

                            var decimalGrossWeight = palletNetWeight + grossWeight;
                            var weight = Math.floor(decimalGrossWeight - palletNetWeight);
                            var reamsPerContainer = Math.floor(palletsPerContainer * (box.netWeightPerPallet / box.uomConversionRates.ream));
                            var boxesPerContainer = Math.floor((weight * 1000) / box.uomConversionRates.box);
                            log.debug('reamsPerContainer', reamsPerContainer);

                            if(palletsPerLayer > palletsPerContainer){
                                palletsPerLayer = palletsPerContainer;
                            }

                            // Calculate the total weight of all items
                            totalWeight += box.weight;
                            var recommendedWeight = Math.max(0, box.maxWeightTon - totalWeight);
                
                            if (palletsPerLayer > palletsPerContainer) {
                                palletsPerLayer = palletsPerContainer;
                            }
                
                            // List recommended items if recommendedWeight > 0
                            var recommendedItems = [];
                            if (recommendedWeight > 0) {
                                box.itemRecommendation.forEach(function (item) {
                                    var maxQuantity = Math.floor((recommendedWeight * 1000) / item.netWeightperPallet);
                                    var maxLayers = Math.floor(binFolio.height / item.height);
                
                                    if (maxQuantity > 0) {
                                        recommendedItems.push({
                                            name: item.name,
                                            maxQuantity: maxQuantity,
                                            maxLayers: maxLayers,
                                            length: item.length,
                                            width: item.width,
                                            height: item.height,
                                            netWeightperPallet: item.netWeightperPallet,
                                            isPriority: item.name.toLowerCase().includes("double a") ? 1 : 0 // Prioritize Double A brand
                                        });
                                    }
                                });

                                // Sort recommendations by priority first, then by best fit (tightest space)
                                recommendedItems.sort(function (a, b) {
                                    if (b.isPriority !== a.isPriority) {
                                        return b.isPriority - a.isPriority;
                                    }
                                    return (b.length * b.width * b.height) - (a.length * a.width * a.height); 
                                });

                                // Keep only the top 3-5 tightest fitting recommendations
                                recommendedItems = recommendedItems.slice(0, 5);
                            }

                            containerListFolio.push({
                                parent: parent,
                                type: box.type,
                                product: box.product,
                                internalId: box.internalId,
                                displayName: box.displayName,
                                weight: box.weight,
                                maxWeightTon: box.maxWeightTon,
                                grossWeight: grossWeight,
                                netWeight: netWeight,
                                reamsPerContainer: reamsPerContainer,
                                noOfPallets: palletsPerContainer,
                                palletsPerContainer: palletsPerContainer,
                                palletsPerLayer: palletsPerLayer,
                                productLayer: box.layer,
                                boxesPerContainer: boxesPerContainer,
                                recommendedItems: recommendedItems
                            });

                            for (var i = 0; i < palletsPerContainer; i++) {

                                boxesFolio3D.push({
                                    parent: parent,
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
                                    maxWeightTon: box.maxWeightTon,
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
                                    recommendedItems: recommendedItems
                                });
                            }
                        }
                    });
                });
                
                var remainingBoxes = null;
                var colorMap = {};
                var occupiedLengths  = [];
                var maxZForX = 0;
                var totPalletsPerLayer = 0;
                var previousBox = null;
                var fit = true;

                boxesFolio3D.forEach(function (box, boxIndex) {
            
                    if (box.type === 'folio') {
                        if (!colorMap[box.product]) {
                            colorMap[box.product] = colors[Object.keys(colorMap).length % colors.length];
                        }
                        var currentItemColor = colorMap[box.product]; 

                        var rotations = generateLogicalRotations(box);
                        var bestFitRotation = null;
                    
                        // Set up to track the max z for the current x position
                        var positionKey = x + ',' + z; // Create the key as 'x,z'
                        var occupiedHeightAtPosition = occupiedHeights[positionKey] || 0;
                    
                        // Set the initial benchmark using the first box rotation 
                        var firstRotation = rotations[0];
                        var initialRemainingDimensions = {
                            remainingLength: binFolio.length - z,
                            remainingWidth: binFolio.width - x,
                            remainingHeight: binFolio.height - y
                        };
                        
                        var initialRemainingVolume = initialRemainingDimensions.remainingLength * 
                                                    initialRemainingDimensions.remainingWidth * 
                                                    initialRemainingDimensions.remainingHeight;
                        
                        var bestFitRotation = null;
                        if (canFit(initialRemainingDimensions, rotations[0])) {
                            bestFitRotation = rotations[0]; 
                        }
                        
                        // Define the current position before checking fits
                        var currentPosition = {
                            remainingLength: binFolio.length - z,
                            remainingWidth: binFolio.width - x,  
                            remainingHeight: binFolio.height - y
                        };
                        
                        var maxRowHeight = 0;
                        
                        // Find the smallest width and length among all boxes
                        var minBoxWidth = Infinity;
                        var minBoxLength = Infinity;

                        for (var i = 0; i < rotations.length; i++) {
                            if (rotations[i].width < minBoxWidth) {
                                minBoxWidth = rotations[i].width;
                            }
                            if (rotations[i].length < minBoxLength) {
                                minBoxLength = rotations[i].length;
                            }
                        }

                        rotations.forEach(function (rotatedBox) {
                            var remainingWidth = binFolio.width - x;
                            var remainingLength = binFolio.length - z;
                            var remainingHeight = binFolio.height - y;

                            // Check if this is the last box in the row
                            var isLastBoxInRow = remainingWidth <= (minBoxWidth + rotatedBox.width);

                            // Prioritize placing the last box with X > Z if possible
                            if (isLastBoxInRow) {
                                if (rotatedBox.width > rotatedBox.length && x + rotatedBox.width <= binFolio.width) {
                                    bestFitRotation = rotatedBox;
                                } 
                                else if (rotatedBox.length > rotatedBox.width && z + rotatedBox.length <= binFolio.length) {
                                    bestFitRotation = rotatedBox;
                                }
                            }

                            // Move to a new column if needed
                            if (bestFitRotation && x + bestFitRotation.width > binFolio.width) {
                                x = 0;
                                maxZForX += bestFitRotation.length;
                                z = maxZForX;
                            }
                        
                            // Move to a new layer if needed
                            if (bestFitRotation && occupiedLengths[x] + bestFitRotation.length > binFolio.length) {
                                var shortestDimension = Math.min(bestFitRotation.width, bestFitRotation.length);
                                var totalCanFit = (binFolio.length - occupiedLengths[previousBox.x]) / shortestDimension;
                        
                                if (Math.floor(totalCanFit) >= 1) {
                                    var rotatedWidth = Math.max(bestFitRotation.width, bestFitRotation.length);
                                    var rotatedLength = Math.min(bestFitRotation.width, bestFitRotation.length);
                        
                                    // Try with width > length
                                    if ((z + rotatedLength) <= binFolio.length) {
                                        bestFitRotation.width = rotatedWidth;
                                        bestFitRotation.length = rotatedLength;
                                        z -= bestFitRotation.width;
                                        maxZForX -= bestFitRotation.width;
                                    } 
                        
                                    if (z + bestFitRotation.length <= binFolio.length) {
                                        x = previousBox.x;
                                        maxZForX = occupiedLengths[x];
                                        z += bestFitRotation.length;
                                    } else {
                                        fit = false;
                                    }
                        
                                } else {
                                    z = 0;
                                    y += bestFitRotation.height;
                                    x = 0;
                                    maxZForX = 0;
                                    occupiedLengths = [];
                        
                                    itemsPerLayerFolio.push(palletsPerLayerFolio);
                                    palletsPerLayerFolio = 0;
                                    layerCountFolio++;
                                }

                            }
                        
                            // If no space in X and Z axis, move to a new layer (increase Y)
                            if (!bestFitRotation && y + maxRowHeight + rotatedBox.height <= binFolio.height) {

                                var shortestDimension = Math.min(rotatedBox.width, rotatedBox.length);
                                var totalCanFit = (binFolio.length - occupiedLengths[previousBox.x]) / shortestDimension;

                                if (Math.floor(totalCanFit) >= 1) {

                                    var rotatedWidth = Math.max(rotatedBox.width, rotatedBox.length);
                                    var rotatedLength = Math.min(rotatedBox.width, rotatedBox.length);

                                    if (z + rotatedLength <= binFolio.length) {
                                        rotatedBox.width = rotatedWidth;
                                        rotatedBox.length = rotatedLength;

                                        z -= rotatedBox.width;

                                        maxZForX -= rotatedBox.width;
                                    } 

                                    if(z + rotatedBox.length <= binFolio.length){
                                        x = previousBox.x;
                                        maxZForX = occupiedLengths[x];
                                        z += rotatedBox.length;
                                    } else {
                                        fit = false;
                                    }


                                } else {

                                    y += maxRowHeight; 
                                    maxRowHeight = rotatedBox.height;
                                    x = 0;  
                                    z = 0;  
                                }
                                    
                                bestFitRotation = rotatedBox;
                            }
                        
                            // Update available space
                            currentPosition = {
                                remainingLength: binFolio.length - z,
                                remainingWidth: binFolio.width - x,
                                remainingHeight: binFolio.height - y
                            };

                        });

                        var heightMap = {};  
                        if (bestFitRotation) {
                            // Find the max occupied space on the z-axis for the range of x indices
                            for (var xi = x; xi < x + bestFitRotation.width; xi++) {

                                if (occupiedLengths[xi]) {
                                    maxZForX = occupiedLengths[xi];
                                } else {
                                    maxZForX = z;
                                }
                            }

                            var positionKey = x + "," + z;
                            if (!occupiedHeights[positionKey]) {
                                occupiedHeights[positionKey] = 0;
                            }
                        
                            var occupiedHeightAtPosition = occupiedHeights[positionKey];
                            
                            if (y + bestFitRotation.height <= binFolio.height) {
                                
                                palletsPerLayerFolio++;

                                // move to a new column
                                if (x + bestFitRotation.width > binFolio.width) {
                                    x = 0;
                                    maxZForX += bestFitRotation.length;
                                    z = maxZForX;
                                }
                                
                                // move to a new layer
                                if (z + bestFitRotation.length > binFolio.length) {
                                    var shortestDimension = Math.min(bestFitRotation.width, bestFitRotation.length);
                                    var totalCanFit = (binFolio.length - occupiedLengths[previousBox.x]) / shortestDimension;

                                    if (Math.floor(totalCanFit) >= 1) {

                                        var rotatedWidth = Math.max(bestFitRotation.width, bestFitRotation.length);
                                        var rotatedLength = Math.min(bestFitRotation.width, bestFitRotation.length);

                                        if (z + rotatedLength <= binFolio.length) {
                                            bestFitRotation.width = rotatedWidth;
                                            bestFitRotation.length = rotatedLength;

                                            z -= bestFitRotation.width;

                                            maxZForX -= bestFitRotation.width;
                                        } 

                                        if(z + bestFitRotation.length <= binFolio.length){
                                            x = previousBox.x;
                                            maxZForX = occupiedLengths[x];
                                            z += bestFitRotation.length;
                                        } else {

                                            fit = false;
                                        }

                                    } else {

                                        z = 0;
                                        y += bestFitRotation.height;
                                        x = 0;
                                        maxZForX = 0;
                                        occupiedLengths = [];
                                        
                                        itemsPerLayerFolio.push(palletsPerLayerFolio);
                                        palletsPerLayerFolio = 0;
                                        layerCountFolio++;
                                    }

                                }

                                if(fit === true){

                                    if (!heightMap[positionKey]) {
                                        heightMap[positionKey] = occupiedHeightAtPosition + bestFitRotation.height;
                                    } else {
                                        heightMap[positionKey] = Math.max(heightMap[positionKey], occupiedHeightAtPosition + bestFitRotation.height);
                                    }
        
                                    var minOccupiedHeight = Math.min.apply(null, Object.values(heightMap)) || 0;
                                    var remainingHeight = binFolio.height - minOccupiedHeight;
        
                                    totPalletsPerLayer++;
                                    previousBox = {
                                        x: x,
                                        y: y,
                                        z: maxZForX,
                                        width: bestFitRotation.width,
                                        height: bestFitRotation.height,
                                        length: bestFitRotation.length
                                    };

                                    packedBoxesFolio.push({
                                        x: x,
                                        y: y,
                                        z: maxZForX, 
                                        originalDimensions: box,
                                        box: bestFitRotation,
                                        color: currentItemColor,
                                        remainingDimensions: {
                                            remainingLength: binFolio.length - (z + bestFitRotation.length),
                                            remainingWidth: binFolio.width - x,
                                            remainingHeight: remainingHeight
                                        },
                                        type: box.type,
                                        product: box.product,
                                        internalId: box.internalId,
                                        weight: box.weight,
                                        maxWeightTon: box.maxWeightTon,
                                        price: box.price,
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
                                        remainingHeight: remainingHeight,
                                        minOccupiedHeight: minOccupiedHeight,
                                        recommendedItems: box.recommendedItems
                                    });

                                    if (!totalPriceByProductFolio[bestFitRotation.product]) {
                                        totalPriceByProductFolio[bestFitRotation.product] = 0;
                                    }
                                    totalPriceByProductFolio[bestFitRotation.product] += bestFitRotation.price;
                                    grandTotalFolio += bestFitRotation.price;
                                    netWeightFolio += bestFitRotation.weight;
                                    grossWeightFolio += bestFitRotation.weight;
                                    
                                    // maxZForX += bestFitRotation.length;
                                    for (var xi = x; xi < x + bestFitRotation.width; xi++) {
                                        occupiedLengths[xi] = maxZForX + bestFitRotation.length;
                                    }
        
                                    occupiedHeights[positionKey] = Math.max(occupiedHeightAtPosition, occupiedHeightAtPosition + bestFitRotation.height);
                                }
                                x += bestFitRotation.width;
                                
                            } else {

                                currentBox = box;
                                allContainersFolio.push({ packedBoxes: packedBoxesFolio, containerListFolio: containerListFolio });
                                
                                x = 0;
                                y = 0;
                                z = 0;
                                maxZForX = 0;
                                heightMap = {};  
                                packedBoxesFolio = [];
                                occupiedLengths = {};
                                itemsPerLayerFolio = [];
                                itemsPerLayerFolio.push(totPalletsPerLayer);
                                totPalletsPerLayer = 1;
                                layerCountFolio = 0;
                                palletsPerLayerFolio = 0;
                                itemsPerLayerFolio = [];
                                
                                
                                if (canFit({ remainingLength: binFolio.length, remainingWidth: binFolio.width, remainingHeight: binFolio.height }, box)) {
                                    packedBoxesFolio.push({
                                        x: x,
                                        y: y,
                                        z: z,
                                        originalDimensions: box,
                                        box: box,
                                        color: currentItemColor,
                                        remainingDimensions: {
                                            remainingLength: binFolio.length - box.length,
                                            remainingWidth: binFolio.width - box.width,
                                            remainingHeight: binFolio.height - box.height
                                        },
                                        type: box.type,
                                        product: box.product,
                                        internalId: box.internalId,
                                        weight: box.weight,
                                        maxWeightTon: box.maxWeightTon,
                                        layer: layerCountFolio,
                                        netWeight: box.netWeight,
                                        grossWeight: box.grossWeight, 
                                        noOfPallets: 1, 
                                        palletsPerContainer: 0, 
                                        palletsPerLayer: 1,
                                        productLayer: box.layer,
                                        parent: box.parent,
                                        displayName: box.displayName,
                                        reamsPerContainer: 0,
                                        boxesPerContainer: 0,
                                        recommendedItems: box.recommendedItems
                                    });
                                    
                                    x += box.width;
                                    log.debug('Placed current box in new container:', box);
                                } else {
                                    log.debug('Current box still cannot fit in the new container:', box);
                                }
                            }
                        } else {

                            currentBox = box;
                            allContainersFolio.push({ packedBoxes: packedBoxesFolio, containerListFolio: containerListFolio });
                            
                            x = 0;
                            y = 0;
                            z = 0;
                            maxZForX = 0;
                            heightMap = {};  
                            packedBoxesFolio = [];
                            occupiedLengths = {};
                            itemsPerLayerFolio = [];
                            itemsPerLayerFolio.push(totPalletsPerLayer);
                            totPalletsPerLayer = 1;
                            layerCountFolio = 0;
                            palletsPerLayerFolio = 0;
                            itemsPerLayerFolio = [];
                            
                            if (canFit({ remainingLength: binFolio.length, remainingWidth: binFolio.width, remainingHeight: binFolio.height }, box)) {
                                packedBoxesFolio.push({
                                    x: x,
                                    y: y,
                                    z: z,
                                    originalDimensions: box,
                                    box: box,
                                    color: currentItemColor,
                                    remainingDimensions: {
                                        remainingLength: binFolio.length - box.length,
                                        remainingWidth: binFolio.width - box.width,
                                        remainingHeight: binFolio.height - box.height
                                    },
                                    type: box.type,
                                    product: box.product,
                                    internalId: box.internalId,
                                    weight: box.weight,
                                    maxWeightTon: box.maxWeightTon,
                                    layer: layerCountFolio,
                                    netWeight: box.netWeight,
                                    grossWeight: box.grossWeight, 
                                    noOfPallets: 1, 
                                    palletsPerContainer: 1, 
                                    palletsPerLayer: 1,
                                    productLayer: box.layer,
                                    parent: box.parent,
                                    displayName: box.displayName,
                                    reamsPerContainer: box.reamsPerContainer,
                                    boxesPerContainer: box.boxesPerContainer,
                                    recommendedItems: box.recommendedItems
                                });
                                
                                x += box.width;
                                log.debug('Placed current box in new container:', box);
                            } else {
                                log.debug('Current box still cannot fit in the new container:', box);
                            }
                        }
                    }
                });
                
                if (packedBoxesFolio.length > 0) {

                    allContainersFolio.push(
                    {
                        packedBoxes: packedBoxesFolio, 
                        containerListFolio: containerListFolio
                    });
                    
                }

                if (totPalletsPerLayer > 0) {
                    itemsPerLayerFolio.push(totPalletsPerLayer);
                }

                if(balanceHeight > 0 || balanceLength > 0 || balanceWidth > 0) 
                {
                    itemRecommendation = true;
                }
            }

            if (hasHoneycomb) {
                var x = 0, y = 0, z = 0; 
                var currentLayerWidth = 0;
                var leftSideWeight = 0;
                var rightSideWeight = 0;
                var boxesThatFitOnX = [];
                var totalWidth = 0;
                var rowNumber = 0;
                var placeOnLeft = true;
                var occupiedHeights = []; 
                var isFirstBox = true;
                var newZ = 0;
                var totalMaxX = 0;
            
                // Get the maximum z value for a given x position
                function getMaxZForX(x, smallestBoxWidth, currentPosition) {
                    var maxZ = 0; 
                    var totalMaxX = 0;
                
                    for (var i = 0; i < packedBoxesHoneycomb.length; i++) {
                        var placedBox = packedBoxesHoneycomb[i];
                        var previousPlacedBox = packedBoxesHoneycomb[i - 1];
                
                        if (placedBox.x === 0) {
                            totalMaxX = placedBox.box.width;
                        } else {
                            totalMaxX += placedBox.box.width;
                        }
                
                        // **Condition 1: Placed at start (X = 0)**
                        if (x === 0 && placedBox.x === 0) {
                            maxZ = Math.max(maxZ, placedBox.z + placedBox.box.length);
                        
                        // **Condition 2: Box placed after another in X direction**
                        } else if (placedBox.x > 0 && placedBox.z === 0) {
                            maxZ = Math.max(maxZ, placedBox.z + placedBox.box.length);
                
                        // **Condition 3: Handling bin width limits and different box sizes**
                        } else if (placedBox.x > 0 && (totalMaxX + smallestBoxWidth > binHoneycomb.width || 
                                (previousPlacedBox && previousPlacedBox.box.length > placedBox.box.length))) {
                            if (previousPlacedBox && previousPlacedBox.box.length > placedBox.box.length &&
                                totalMaxX + smallestBoxWidth > binHoneycomb.width) {
                                maxZ = Math.max(maxZ, placedBox.z + previousPlacedBox.box.length);
                            } else {
                                maxZ = Math.max(maxZ, placedBox.z + placedBox.box.length);
                            }
                        }
                    }
                    return maxZ;
                }            
            
                var allBoxes = Object.values(boxesHoneycomb).flat();

                var minWeight = Math.min.apply(null, allBoxes.map(function (box) {
                    return box.weight;
                }));

                var maxWeight = Math.max.apply(null, allBoxes.map(function (box) {
                    return box.weight;
                }));

                var smallestBoxWidth = Math.min.apply(null, allBoxes.map(function (box) {
                    return box.width;
                }));

                Object.keys(boxesHoneycomb).forEach(function (parent) {
                    var items = boxesHoneycomb[parent];

                    // Sort items by volume (Largest First)
                    items.sort(function (a, b) {
                        return (b.width * b.length * b.height) - (a.width * a.length * a.height);
                    });

                    var totalNetWeightPerPallet = 0;
                    items.forEach(function (box) {
                        if (box.type === 'honeycomb') {
                            totalNetWeightPerPallet += box.netWeightPerPallet;
                        }
                    });

                    items.forEach(function (box) {
                        if (box.type === 'honeycomb') {

                            if(box.baseUnitAbbreviation){
                                var baseUnit = box.baseUnitAbbreviation.toLowerCase();
                                box.weight = (box.weight * box.uomConversionRates[baseUnit]) / box.uomConversionRates.ton;
                                box.maxWeightTon = box.weight;
                            }

                            var totalWeight = 0;
                            var palletsPerLayer = Math.floor((binHoneycomb.width * binHoneycomb.length) / (box.width * box.length)) || 1;
                            var palletsPerContainer = Math.floor(box.weight / (box.netWeightPerPallet / 1000)) || 1;
                            var noOfPallets = Math.floor((box.weight * 1000) / totalNetWeightPerPallet);
                            var palletNetWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                            var grossWeight = (box.grossWeightPerPallet / 1000) * palletsPerContainer;
                            var netWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                            var maxLayers = Math.floor(binHoneycomb.height / box.height);
                            var noOfContainers = noOfPallets / palletsPerContainer || 1;

                            var decimalGrossWeight = palletNetWeight + grossWeight;
                            var weight = Math.floor(decimalGrossWeight - palletNetWeight);
                            var reamsPerContainer = Math.floor((weight * 1000) / box.uomConversionRates.ream);
                            var boxesPerContainer = Math.floor((weight * 1000) / box.uomConversionRates.box);

                            if(palletsPerLayer > palletsPerContainer){
                                palletsPerLayer = palletsPerContainer;
                            }

                            // Calculate the total weight of all items
                            totalWeight += box.weight;
                            var recommendedWeight = Math.max(0, box.maxWeightTon - totalWeight);
                
                            if (palletsPerLayer > palletsPerContainer) {
                                palletsPerLayer = palletsPerContainer;
                            }
                
                            // List recommended items if recommendedWeight > 0
                            var recommendedItems = [];
                            if (recommendedWeight > 0) {
                                box.itemRecommendation.forEach(function (item) {
                                    var maxQuantity = Math.floor((recommendedWeight * 1000) / item.netWeightperPallet);
                                    var maxLayers = Math.floor(binHoneycomb.height / item.height);
                
                                    if (maxQuantity > 0) {
                                        recommendedItems.push({
                                            name: item.name,
                                            maxQuantity: maxQuantity,
                                            maxLayers: maxLayers,
                                            length: item.length,
                                            width: item.width,
                                            height: item.height,
                                            netWeightperPallet: item.netWeightperPallet,
                                            isPriority: item.name.toLowerCase().includes("double a") ? 1 : 0 // Prioritize Double A brand
                                        });
                                    }
                                });

                                // Sort recommendations by priority first, then by best fit (tightest space)
                                recommendedItems.sort(function (a, b) {
                                    if (b.isPriority !== a.isPriority) {
                                        return b.isPriority - a.isPriority;
                                    }
                                    return (b.length * b.width * b.height) - (a.length * a.width * a.height); 
                                });

                                // Keep only the top 3-5 tightest fitting recommendations
                                recommendedItems = recommendedItems.slice(0, 5);
                            }

                            containerListHoneycomb.push({
                                parent: parent,
                                type: box.type,
                                product: box.product,
                                internalId: box.internalId,
                                displayName: box.displayName,
                                weight: box.weight,
                                maxWeightTon: box.maxWeightTon,
                                grossWeight: grossWeight,
                                netWeight: netWeight,
                                reamsPerContainer: reamsPerContainer,
                                noOfPallets: palletsPerContainer,
                                palletsPerContainer: palletsPerContainer,
                                palletsPerLayer: palletsPerLayer,
                                productLayer: box.layer,
                                boxesPerContainer: boxesPerContainer,
                                recommendedItems: recommendedItems
                            });

                            for (var i = 0; i < palletsPerContainer; i++) {

                                boxesHoneycomb3D.push({
                                    parent: parent,
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
                                    maxWeightTon: box.maxWeightTon,
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
                                    recommendedItems: recommendedItems
                                });
                            }
                        }
                    });
                });
                
                var remainingBoxes = null;
                var colorMap = {};
                var occupiedLengths  = [];
                var maxZForX = 0;
                var totPalletsPerLayer = 0;
                var previousBox = null;
                var fit = true;

                boxesHoneycomb3D.forEach(function (box, boxIndex) {
            
                    if (box.type === 'honeycomb') {
                        if (!colorMap[box.product]) {
                            colorMap[box.product] = colors[Object.keys(colorMap).length % colors.length];
                        }
                        var currentItemColor = colorMap[box.product]; 

                        var rotations = generateLogicalRotations(box);
                        var bestFitRotation = null;
                    
                        // Set up to track the max z for the current x position
                        var positionKey = x + ',' + z; // Create the key as 'x,z'
                        var occupiedHeightAtPosition = occupiedHeights[positionKey] || 0;
                    
                        // Set the initial benchmark using the first box rotation 
                        var firstRotation = rotations[0];
                        var initialRemainingDimensions = {
                            remainingLength: binHoneycomb.length - z,
                            remainingWidth: binHoneycomb.width - x,
                            remainingHeight: binHoneycomb.height - y
                        };
                        
                        var initialRemainingVolume = initialRemainingDimensions.remainingLength * 
                                                    initialRemainingDimensions.remainingWidth * 
                                                    initialRemainingDimensions.remainingHeight;
                        
                        var bestFitRotation = null;
                        if (canFit(initialRemainingDimensions, rotations[0])) {
                            bestFitRotation = rotations[0]; 
                        }
                        
                        // Define the current position before checking fits
                        var currentPosition = {
                            remainingLength: binHoneycomb.length - z,
                            remainingWidth: binHoneycomb.width - x,  
                            remainingHeight: binHoneycomb.height - y
                        };
                        
                        var maxRowHeight = 0;
                        
                        // Find the smallest width and length among all boxes
                        var minBoxWidth = Infinity;
                        var minBoxLength = Infinity;

                        for (var i = 0; i < rotations.length; i++) {
                            if (rotations[i].width < minBoxWidth) {
                                minBoxWidth = rotations[i].width;
                            }
                            if (rotations[i].length < minBoxLength) {
                                minBoxLength = rotations[i].length;
                            }
                        }

                        rotations.forEach(function (rotatedBox) {
                            var remainingWidth = binHoneycomb.width - x;
                            var remainingLength = binHoneycomb.length - z;
                            var remainingHeight = binHoneycomb.height - y;

                            // Check if this is the last box in the row
                            var isLastBoxInRow = remainingWidth <= (minBoxWidth + rotatedBox.width);

                            // Prioritize placing the last box with X > Z if possible
                            if (isLastBoxInRow) {
                                if (rotatedBox.width > rotatedBox.length && x + rotatedBox.width <= binHoneycomb.width) {
                                    bestFitRotation = rotatedBox;
                                } 
                                else if (rotatedBox.length > rotatedBox.width && z + rotatedBox.length <= binHoneycomb.length) {
                                    bestFitRotation = rotatedBox;
                                }
                            }

                            // Move to a new column if needed
                            if (bestFitRotation && x + bestFitRotation.width > binHoneycomb.width) {
                                x = 0;
                                maxZForX += bestFitRotation.length;
                                z = maxZForX;
                            }
                        
                            // Move to a new layer if needed
                            if (bestFitRotation && occupiedLengths[x] + bestFitRotation.length > binHoneycomb.length) {
                                var shortestDimension = Math.min(bestFitRotation.width, bestFitRotation.length);
                                var totalCanFit = (binHoneycomb.length - occupiedLengths[previousBox.x]) / shortestDimension;
                        
                                if (Math.floor(totalCanFit) >= 1) {
                                    var rotatedWidth = Math.max(bestFitRotation.width, bestFitRotation.length);
                                    var rotatedLength = Math.min(bestFitRotation.width, bestFitRotation.length);
                        
                                    // Try with width > length
                                    if ((z + rotatedLength) <= binHoneycomb.length) {
                                        bestFitRotation.width = rotatedWidth;
                                        bestFitRotation.length = rotatedLength;
                                        z -= bestFitRotation.width;
                                        maxZForX -= bestFitRotation.width;
                                    } 
                        
                                    if (z + bestFitRotation.length <= binHoneycomb.length) {
                                        x = previousBox.x;
                                        maxZForX = occupiedLengths[x];
                                        z += bestFitRotation.length;
                                    } else {
                                        fit = false;
                                    }
                        
                                } else {
                                    z = 0;
                                    y += bestFitRotation.height;
                                    x = 0;
                                    maxZForX = 0;
                                    occupiedLengths = [];
                        
                                    itemsPerLayerHoneycomb.push(palletsPerLayerHoneycomb);
                                    palletsPerLayerHoneycomb = 0;
                                    layerCountHoneycomb++;
                                }

                            }
                        
                            // If no space in X and Z axis, move to a new layer (increase Y)
                            if (!bestFitRotation && y + maxRowHeight + rotatedBox.height <= binHoneycomb.height) {

                                var shortestDimension = Math.min(rotatedBox.width, rotatedBox.length);
                                var totalCanFit = (binHoneycomb.length - occupiedLengths[previousBox.x]) / shortestDimension;

                                if (Math.floor(totalCanFit) >= 1) {

                                    var rotatedWidth = Math.max(rotatedBox.width, rotatedBox.length);
                                    var rotatedLength = Math.min(rotatedBox.width, rotatedBox.length);

                                    if (z + rotatedLength <= binHoneycomb.length) {
                                        rotatedBox.width = rotatedWidth;
                                        rotatedBox.length = rotatedLength;

                                        z -= rotatedBox.width;

                                        maxZForX -= rotatedBox.width;
                                    } 

                                    if(z + rotatedBox.length <= binHoneycomb.length){
                                        x = previousBox.x;
                                        maxZForX = occupiedLengths[x];
                                        z += rotatedBox.length;
                                    } else {
                                        fit = false;
                                    }


                                } else {

                                    y += maxRowHeight; 
                                    maxRowHeight = rotatedBox.height;
                                    x = 0;  
                                    z = 0;  
                                }
                                    
                                bestFitRotation = rotatedBox;
                            }
                        
                            // Update available space
                            currentPosition = {
                                remainingLength: binHoneycomb.length - z,
                                remainingWidth: binHoneycomb.width - x,
                                remainingHeight: binHoneycomb.height - y
                            };

                        });

                        var heightMap = {};  
                        if (bestFitRotation) {
                            // Find the max occupied space on the z-axis for the range of x indices
                            for (var xi = x; xi < x + bestFitRotation.width; xi++) {

                                if (occupiedLengths[xi]) {
                                    maxZForX = occupiedLengths[xi];
                                } else {
                                    maxZForX = z;
                                }
                            }

                            var positionKey = x + "," + z;
                            if (!occupiedHeights[positionKey]) {
                                occupiedHeights[positionKey] = 0;
                            }
                        
                            var occupiedHeightAtPosition = occupiedHeights[positionKey];
                            
                            if (y + bestFitRotation.height <= binHoneycomb.height) {
                                
                                palletsPerLayerHoneycomb++;

                                // move to a new column
                                if (x + bestFitRotation.width > binHoneycomb.width) {
                                    x = 0;
                                    maxZForX += bestFitRotation.length;
                                    z = maxZForX;
                                }
                                
                                // move to a new layer
                                if (z + bestFitRotation.length > binHoneycomb.length) {
                                    var shortestDimension = Math.min(bestFitRotation.width, bestFitRotation.length);
                                    var totalCanFit = (binHoneycomb.length - occupiedLengths[previousBox.x]) / shortestDimension;

                                    if (Math.floor(totalCanFit) >= 1) {

                                        var rotatedWidth = Math.max(bestFitRotation.width, bestFitRotation.length);
                                        var rotatedLength = Math.min(bestFitRotation.width, bestFitRotation.length);

                                        if (z + rotatedLength <= binHoneycomb.length) {
                                            bestFitRotation.width = rotatedWidth;
                                            bestFitRotation.length = rotatedLength;

                                            z -= bestFitRotation.width;

                                            maxZForX -= bestFitRotation.width;
                                        } 

                                        if(z + bestFitRotation.length <= binHoneycomb.length){
                                            x = previousBox.x;
                                            maxZForX = occupiedLengths[x];
                                            z += bestFitRotation.length;
                                        } else {

                                            fit = false;
                                        }

                                    } else {

                                        z = 0;
                                        y += bestFitRotation.height;
                                        x = 0;
                                        maxZForX = 0;
                                        occupiedLengths = [];
                                        
                                        itemsPerLayerHoneycomb.push(palletsPerLayerHoneycomb);
                                        palletsPerLayerHoneycomb = 0;
                                        layerCountHoneycomb++;
                                    }

                                }

                                if(fit === true){

                                    if (!heightMap[positionKey]) {
                                        heightMap[positionKey] = occupiedHeightAtPosition + bestFitRotation.height;
                                    } else {
                                        heightMap[positionKey] = Math.max(heightMap[positionKey], occupiedHeightAtPosition + bestFitRotation.height);
                                    }
        
                                    var minOccupiedHeight = Math.min.apply(null, Object.values(heightMap)) || 0;
                                    var remainingHeight = binHoneycomb.height - minOccupiedHeight;
        
                                    totPalletsPerLayer++;
                                    previousBox = {
                                        x: x,
                                        y: y,
                                        z: maxZForX,
                                        width: bestFitRotation.width,
                                        height: bestFitRotation.height,
                                        length: bestFitRotation.length
                                    };

                                    packedBoxesHoneycomb.push({
                                        x: x,
                                        y: y,
                                        z: maxZForX, 
                                        originalDimensions: box,
                                        box: bestFitRotation,
                                        color: currentItemColor,
                                        remainingDimensions: {
                                            remainingLength: binHoneycomb.length - (z + bestFitRotation.length),
                                            remainingWidth: binHoneycomb.width - x,
                                            remainingHeight: remainingHeight
                                        },
                                        type: box.type,
                                        product: box.product,
                                        internalId: box.internalId,
                                        weight: box.weight,
                                        maxWeightTon: box.maxWeightTon,
                                        price: box.price,
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
                                        remainingHeight: remainingHeight,
                                        minOccupiedHeight: minOccupiedHeight,
                                        recommendedItems: box.recommendedItems
                                    });

                                    if (!totalPriceByProductHoneycomb[bestFitRotation.product]) {
                                        totalPriceByProductHoneycomb[bestFitRotation.product] = 0;
                                    }
                                    totalPriceByProductHoneycomb[bestFitRotation.product] += bestFitRotation.price;
                                    grandTotalHoneycomb += bestFitRotation.price;
                                    netWeightHoneycomb += bestFitRotation.weight;
                                    grossWeightHoneycomb += bestFitRotation.weight;
                                    
                                    // maxZForX += bestFitRotation.length;
                                    for (var xi = x; xi < x + bestFitRotation.width; xi++) {
                                        occupiedLengths[xi] = maxZForX + bestFitRotation.length;
                                    }
        
                                    occupiedHeights[positionKey] = Math.max(occupiedHeightAtPosition, occupiedHeightAtPosition + bestFitRotation.height);
                                }
                                x += bestFitRotation.width;
                                
                            } else {

                                currentBox = box;
                                allContainersHoneycomb.push({ packedBoxes: packedBoxesHoneycomb, containerListHoneycomb: containerListHoneycomb });
                                
                                x = 0;
                                y = 0;
                                z = 0;
                                maxZForX = 0;
                                heightMap = {};  
                                packedBoxesHoneycomb = [];
                                occupiedLengths = {};
                                itemsPerLayerHoneycomb = [];
                                itemsPerLayerHoneycomb.push(totPalletsPerLayer);
                                totPalletsPerLayer = 1;
                                layerCountHoneycomb = 0;
                                palletsPerLayerHoneycomb = 0;
                                itemsPerLayerHoneycomb = [];
                                
                                
                                if (canFit({ remainingLength: binHoneycomb.length, remainingWidth: binHoneycomb.width, remainingHeight: binHoneycomb.height }, box)) {
                                    packedBoxesHoneycomb.push({
                                        x: x,
                                        y: y,
                                        z: z,
                                        originalDimensions: box,
                                        box: box,
                                        color: currentItemColor,
                                        remainingDimensions: {
                                            remainingLength: binHoneycomb.length - box.length,
                                            remainingWidth: binHoneycomb.width - box.width,
                                            remainingHeight: binHoneycomb.height - box.height
                                        },
                                        type: box.type,
                                        product: box.product,
                                        internalId: box.internalId,
                                        weight: box.weight,
                                        maxWeightTon: box.maxWeightTon,
                                        layer: layerCountHoneycomb,
                                        netWeight: box.netWeight,
                                        grossWeight: box.grossWeight, 
                                        noOfPallets: 1, 
                                        palletsPerContainer: 0, 
                                        palletsPerLayer: 1,
                                        productLayer: box.layer,
                                        parent: box.parent,
                                        displayName: box.displayName,
                                        reamsPerContainer: 0,
                                        boxesPerContainer: 0,
                                        recommendedItems: box.recommendedItems
                                    });
                                    
                                    x += box.width;
                                    log.debug('Placed current box in new container:', box);
                                } else {
                                    log.debug('Current box still cannot fit in the new container:', box);
                                }
                            }
                        } else {

                            currentBox = box;
                            allContainersHoneycomb.push({ packedBoxes: packedBoxesHoneycomb, containerListHoneycomb: containerListHoneycomb });
                            
                            x = 0;
                            y = 0;
                            z = 0;
                            maxZForX = 0;
                            heightMap = {};  
                            packedBoxesHoneycomb = [];
                            occupiedLengths = {};
                            itemsPerLayerHoneycomb = [];
                            itemsPerLayerHoneycomb.push(totPalletsPerLayer);
                            totPalletsPerLayer = 1;
                            layerCountHoneycomb = 0;
                            palletsPerLayerHoneycomb = 0;
                            itemsPerLayerHoneycomb = [];
                            
                            if (canFit({ remainingLength: binHoneycomb.length, remainingWidth: binHoneycomb.width, remainingHeight: binHoneycomb.height }, box)) {
                                packedBoxesHoneycomb.push({
                                    x: x,
                                    y: y,
                                    z: z,
                                    originalDimensions: box,
                                    box: box,
                                    color: currentItemColor,
                                    remainingDimensions: {
                                        remainingLength: binHoneycomb.length - box.length,
                                        remainingWidth: binHoneycomb.width - box.width,
                                        remainingHeight: binHoneycomb.height - box.height
                                    },
                                    type: box.type,
                                    product: box.product,
                                    internalId: box.internalId,
                                    weight: box.weight,
                                    maxWeightTon: box.maxWeightTon,
                                    layer: layerCountHoneycomb,
                                    netWeight: box.netWeight,
                                    grossWeight: box.grossWeight, 
                                    noOfPallets: 1, 
                                    palletsPerContainer: 1, 
                                    palletsPerLayer: 1,
                                    productLayer: box.layer,
                                    parent: box.parent,
                                    displayName: box.displayName,
                                    reamsPerContainer: box.reamsPerContainer,
                                    boxesPerContainer: box.boxesPerContainer,
                                    recommendedItems: box.recommendedItems
                                });
                                
                                x += box.width;
                                log.debug('Placed current box in new container:', box);
                            } else {
                                log.debug('Current box still cannot fit in the new container:', box);
                            }
                        }
                    }
                });
                
                if (packedBoxesHoneycomb.length > 0) {

                    allContainersHoneycomb.push(
                    {
                        packedBoxes: packedBoxesHoneycomb, 
                        containerListHoneycomb: containerListHoneycomb
                    });
                    
                }

                if (totPalletsPerLayer > 0) {
                    itemsPerLayerHoneycomb.push(totPalletsPerLayer);
                }

                if(balanceHeight > 0 || balanceLength > 0 || balanceWidth > 0) 
                {
                    itemRecommendation = true;
                }
            }

            if (hasPulp) {
                var x = 0, y = 0, z = 0; 
                var currentLayerWidth = 0;
                var leftSideWeight = 0;
                var rightSideWeight = 0;
                var boxesThatFitOnX = [];
                var totalWidth = 0;
                var rowNumber = 0;
                var placeOnLeft = true;
                var occupiedHeights = []; 
                var isFirstBox = true;
                var newZ = 0;
                var totalMaxX = 0;
            
                // Get the maximum z value for a given x position
                function getMaxZForX(x, smallestBoxWidth, currentPosition) {
                    var maxZ = 0; 
                    var totalMaxX = 0;
                
                    for (var i = 0; i < packedBoxesPulp.length; i++) {
                        var placedBox = packedBoxesPulp[i];
                        var previousPlacedBox = packedBoxesPulp[i - 1];
                
                        if (placedBox.x === 0) {
                            totalMaxX = placedBox.box.width;
                        } else {
                            totalMaxX += placedBox.box.width;
                        }
                
                        // **Condition 1: Placed at start (X = 0)**
                        if (x === 0 && placedBox.x === 0) {
                            maxZ = Math.max(maxZ, placedBox.z + placedBox.box.length);
                        
                        // **Condition 2: Box placed after another in X direction**
                        } else if (placedBox.x > 0 && placedBox.z === 0) {
                            maxZ = Math.max(maxZ, placedBox.z + placedBox.box.length);
                
                        // **Condition 3: Handling bin width limits and different box sizes**
                        } else if (placedBox.x > 0 && (totalMaxX + smallestBoxWidth > binPulp.width || 
                                (previousPlacedBox && previousPlacedBox.box.length > placedBox.box.length))) {
                            if (previousPlacedBox && previousPlacedBox.box.length > placedBox.box.length &&
                                totalMaxX + smallestBoxWidth > binPulp.width) {
                                maxZ = Math.max(maxZ, placedBox.z + previousPlacedBox.box.length);
                            } else {
                                maxZ = Math.max(maxZ, placedBox.z + placedBox.box.length);
                            }
                        }
                    }
                    return maxZ;
                }            
            
                var allBoxes = Object.values(boxesPulp).flat();

                var minWeight = Math.min.apply(null, allBoxes.map(function (box) {
                    return box.weight;
                }));

                var maxWeight = Math.max.apply(null, allBoxes.map(function (box) {
                    return box.weight;
                }));

                var smallestBoxWidth = Math.min.apply(null, allBoxes.map(function (box) {
                    return box.width;
                }));

                Object.keys(boxesPulp).forEach(function (parent) {
                    var items = boxesPulp[parent];

                    // Sort items by volume (Largest First)
                    items.sort(function (a, b) {
                        return (b.width * b.length * b.height) - (a.width * a.length * a.height);
                    });

                    var totalNetWeightPerPallet = 0;
                    items.forEach(function (box) {
                        if (box.type === 'pulp') {
                            totalNetWeightPerPallet += box.netWeightPerPallet;
                        }
                    });

                    items.forEach(function (box) {
                        if (box.type === 'pulp') {
                            
                            if(box.baseUnitAbbreviation){
                                var baseUnit = box.baseUnitAbbreviation.toLowerCase();
                                // box.weight = (box.weight * box.uomConversionRates[baseUnit]) / box.uomConversionRates.ton;
                                box.weight = (box.weight * box.uomConversionRates[baseUnit]);
                                box.maxWeightTon = box.weight;
                            }

                            var totalWeight = 0;
                            var palletsPerLayer = Math.floor((binPulp.width * binPulp.length) / (box.width * box.length)) || 1;
                            var palletsPerContainer = Math.floor(box.weight / (box.netWeightPerPallet / 1000)) || 1;
                            var noOfPallets = Math.floor((box.weight * 1000) / totalNetWeightPerPallet);
                            var palletNetWeight = (box.netWeightPerPallet * palletsPerContainer)  / 1000;
                            var grossWeight = (box.grossWeightPerPallet * palletsPerContainer)  / 1000;
                            var netWeight = (box.netWeightPerPallet * palletsPerContainer)  / 1000;
                            var maxLayers = Math.floor(binPulp.height / box.height);
                            var noOfContainers = noOfPallets / palletsPerContainer || 1;

                            var decimalGrossWeight = palletNetWeight + grossWeight;
                            var weight = decimalGrossWeight - palletNetWeight;
                            var balesPerContainer = Math.floor(weight / box.uomConversionRates.bale);
                            var unitsPerContainer = Math.floor(weight / box.uomConversionRates.unit);

                            if(palletsPerLayer > palletsPerContainer){
                                palletsPerLayer = palletsPerContainer;
                            }

                            // Calculate the total weight of all items
                            totalWeight += box.weight;
                            var recommendedWeight = Math.max(0, box.maxWeightTon - totalWeight);
                
                            if (palletsPerLayer > palletsPerContainer) {
                                palletsPerLayer = palletsPerContainer;
                            }
                
                            // List recommended items if recommendedWeight > 0
                            var recommendedItems = [];
                            if (recommendedWeight > 0) {
                                box.itemRecommendation.forEach(function (item) {
                                    var maxQuantity = Math.floor((recommendedWeight * 1000) / item.netWeightperPallet);
                                    var maxLayers = Math.floor(binPulp.height / item.height);
                
                                    if (maxQuantity > 0) {
                                        recommendedItems.push({
                                            name: item.name,
                                            maxQuantity: maxQuantity,
                                            maxLayers: maxLayers,
                                            length: item.length,
                                            width: item.width,
                                            height: item.height,
                                            netWeightperPallet: item.netWeightperPallet,
                                            isPriority: item.name.toLowerCase().includes("double a") ? 1 : 0 // Prioritize Double A brand
                                        });
                                    }
                                });

                                // Sort recommendations by priority first, then by best fit (tightest space)
                                recommendedItems.sort(function (a, b) {
                                    if (b.isPriority !== a.isPriority) {
                                        return b.isPriority - a.isPriority;
                                    }
                                    return (b.length * b.width * b.height) - (a.length * a.width * a.height); 
                                });

                                // Keep only the top 3-5 tightest fitting recommendations
                                recommendedItems = recommendedItems.slice(0, 5);
                            }

                            containerListPulp.push({
                                parent: parent,
                                type: box.type,
                                product: box.product,
                                internalId: box.internalId,
                                displayName: box.displayName,
                                weight: box.weight,
                                maxWeightTon: box.maxWeightTon,
                                grossWeight: grossWeight,
                                netWeight: netWeight,
                                noOfPallets: palletsPerContainer,
                                palletsPerContainer: palletsPerContainer,
                                palletsPerLayer: palletsPerLayer,
                                productLayer: box.layer,
                                balesPerContainer: balesPerContainer,
                                unitsPerContainer: unitsPerContainer,
                                recommendedItems: recommendedItems
                            });


                            log.debug('palletspercontainer', palletsPerContainer);
                            for (var i = 0; i < palletsPerContainer; i++) {

                                boxesPulp3D.push({
                                    parent: parent,
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
                                    maxWeightTon: box.maxWeightTon,
                                    netWeightPerPallet: box.netWeightPerPallet,
                                    grossWeightPerPallet: box.grossWeightPerPallet,
                                    grossWeight: grossWeight,
                                    netWeight: netWeight,
                                    palletsPerContainer: palletsPerContainer,
                                    palletsPerLayer: palletsPerLayer,
                                    maxLayers: maxLayers,
                                    noOfPallets: palletsPerContainer,
                                    noOfContainers: noOfContainers,
                                    balesPerContainer: balesPerContainer,
                                    unitsPerContainer: unitsPerContainer,
                                    recommendedItems: recommendedItems
                                });
                            }
                        }
                    });
                });
                
                var remainingBoxes = null;
                var colorMap = {};
                var occupiedLengths  = [];
                var maxZForX = 0;
                var totPalletsPerLayer = 0;
                var previousBox = null;
                var fit = true;


                log.debug('boxesPulp3D.length', boxesPulp3D.length);
                log.debug('boxesPulp3D', boxesPulp3D);
                boxesPulp3D.forEach(function (box, boxIndex) {
            
                    if (box.type === 'pulp') {
                        if (!colorMap[box.product]) {
                            colorMap[box.product] = colors[Object.keys(colorMap).length % colors.length];
                        }
                        var currentItemColor = colorMap[box.product]; 

                        var rotations = generateLogicalRotations(box);
                        var bestFitRotation = null;
                    
                        // Set up to track the max z for the current x position
                        var positionKey = x + ',' + z; // Create the key as 'x,z'
                        var occupiedHeightAtPosition = occupiedHeights[positionKey] || 0;
                    
                        // Set the initial benchmark using the first box rotation 
                        var firstRotation = rotations[0];
                        var initialRemainingDimensions = {
                            remainingLength: binPulp.length - z,
                            remainingWidth: binPulp.width - x,
                            remainingHeight: binPulp.height - y
                        };
                        
                        var initialRemainingVolume = initialRemainingDimensions.remainingLength * 
                                                    initialRemainingDimensions.remainingWidth * 
                                                    initialRemainingDimensions.remainingHeight;
                        
                        var bestFitRotation = null;
                        if (canFit(initialRemainingDimensions, rotations[0])) {
                            bestFitRotation = rotations[0]; 
                        }
                        
                        // Define the current position before checking fits
                        var currentPosition = {
                            remainingLength: binPulp.length - z,
                            remainingWidth: binPulp.width - x,  
                            remainingHeight: binPulp.height - y
                        };
                        
                        var maxRowHeight = 0;
                        
                        // Find the smallest width and length among all boxes
                        var minBoxWidth = Infinity;
                        var minBoxLength = Infinity;

                        for (var i = 0; i < rotations.length; i++) {
                            if (rotations[i].width < minBoxWidth) {
                                minBoxWidth = rotations[i].width;
                            }
                            if (rotations[i].length < minBoxLength) {
                                minBoxLength = rotations[i].length;
                            }
                        }

                        rotations.forEach(function (rotatedBox) {
                            var remainingWidth = binPulp.width - x;
                            var remainingLength = binPulp.length - z;
                            var remainingHeight = binPulp.height - y;

                            // Check if this is the last box in the row
                            var isLastBoxInRow = remainingWidth <= (minBoxWidth + rotatedBox.width);

                            // Prioritize placing the last box with X > Z if possible
                            if (isLastBoxInRow) {
                                if (rotatedBox.width > rotatedBox.length && x + rotatedBox.width <= binPulp.width) {
                                    bestFitRotation = rotatedBox;
                                } 
                                else if (rotatedBox.length > rotatedBox.width && z + rotatedBox.length <= binPulp.length) {
                                    bestFitRotation = rotatedBox;
                                }
                            }

                            // Move to a new column if needed
                            if (bestFitRotation && x + bestFitRotation.width > binPulp.width) {
                                x = 0;
                                maxZForX += bestFitRotation.length;
                                z = maxZForX;
                            }
                        
                            // Move to a new layer if needed
                            if (bestFitRotation && occupiedLengths[x] + bestFitRotation.length > binPulp.length) {
                                var shortestDimension = Math.min(bestFitRotation.width, bestFitRotation.length);
                                var totalCanFit = (binPulp.length - occupiedLengths[previousBox.x]) / shortestDimension;
                        
                                if (Math.floor(totalCanFit) >= 1) {
                                    var rotatedWidth = Math.max(bestFitRotation.width, bestFitRotation.length);
                                    var rotatedLength = Math.min(bestFitRotation.width, bestFitRotation.length);
                        
                                    // Try with width > length
                                    if ((z + rotatedLength) <= binPulp.length) {
                                        bestFitRotation.width = rotatedWidth;
                                        bestFitRotation.length = rotatedLength;
                                        z -= bestFitRotation.width;
                                        maxZForX -= bestFitRotation.width;
                                    } 
                        
                                    if (z + bestFitRotation.length <= binPulp.length) {
                                        x = previousBox.x;
                                        maxZForX = occupiedLengths[x];
                                        z += bestFitRotation.length;
                                    } else {
                                        fit = false;
                                    }
                        
                                } else {
                                    z = 0;
                                    y += bestFitRotation.height;
                                    x = 0;
                                    maxZForX = 0;
                                    occupiedLengths = [];
                        
                                    itemsPerLayerPulp.push(palletsPerLayerPulp);
                                    palletsPerLayerPulp = 0;
                                    layerCountPulp++;
                                }

                            }
                        
                            // If no space in X and Z axis, move to a new layer (increase Y)
                            if (!bestFitRotation && y + maxRowHeight + rotatedBox.height <= binPulp.height) {

                                var shortestDimension = Math.min(rotatedBox.width, rotatedBox.length);
                                var totalCanFit = (binPulp.length - occupiedLengths[previousBox.x]) / shortestDimension;

                                if (Math.floor(totalCanFit) >= 1) {

                                    var rotatedWidth = Math.max(rotatedBox.width, rotatedBox.length);
                                    var rotatedLength = Math.min(rotatedBox.width, rotatedBox.length);

                                    if (z + rotatedLength <= binPulp.length) {
                                        rotatedBox.width = rotatedWidth;
                                        rotatedBox.length = rotatedLength;

                                        z -= rotatedBox.width;

                                        maxZForX -= rotatedBox.width;
                                    } 

                                    if(z + rotatedBox.length <= binPulp.length){
                                        x = previousBox.x;
                                        maxZForX = occupiedLengths[x];
                                        z += rotatedBox.length;
                                    } else {
                                        fit = false;
                                    }


                                } else {

                                    y += maxRowHeight; 
                                    maxRowHeight = rotatedBox.height;
                                    x = 0;  
                                    z = 0;  
                                }
                                    
                                bestFitRotation = rotatedBox;
                            }
                        
                            // Update available space
                            currentPosition = {
                                remainingLength: binPulp.length - z,
                                remainingWidth: binPulp.width - x,
                                remainingHeight: binPulp.height - y
                            };

                        });

                        var heightMap = {};  
                        if (bestFitRotation) {
                            // Find the max occupied space on the z-axis for the range of x indices
                            for (var xi = x; xi < x + bestFitRotation.width; xi++) {

                                if (occupiedLengths[xi]) {
                                    maxZForX = occupiedLengths[xi];
                                } else {
                                    maxZForX = z;
                                }
                            }

                            var positionKey = x + "," + z;
                            if (!occupiedHeights[positionKey]) {
                                occupiedHeights[positionKey] = 0;
                            }
                        
                            var occupiedHeightAtPosition = occupiedHeights[positionKey];
                            
                            if (y + bestFitRotation.height <= binPulp.height) {
                                
                                palletsPerLayerPulp++;

                                // move to a new column
                                if (x + bestFitRotation.width > binPulp.width) {
                                    x = 0;
                                    maxZForX += bestFitRotation.length;
                                    z = maxZForX;
                                }
                                
                                // move to a new layer
                                if (z + bestFitRotation.length > binPulp.length) {
                                    var shortestDimension = Math.min(bestFitRotation.width, bestFitRotation.length);
                                    var totalCanFit = (binPulp.length - occupiedLengths[previousBox.x]) / shortestDimension;

                                    if (Math.floor(totalCanFit) >= 1) {

                                        var rotatedWidth = Math.max(bestFitRotation.width, bestFitRotation.length);
                                        var rotatedLength = Math.min(bestFitRotation.width, bestFitRotation.length);

                                        if (z + rotatedLength <= binPulp.length) {
                                            bestFitRotation.width = rotatedWidth;
                                            bestFitRotation.length = rotatedLength;

                                            z -= bestFitRotation.width;

                                            maxZForX -= bestFitRotation.width;
                                        } 

                                        if(z + bestFitRotation.length <= binPulp.length){
                                            x = previousBox.x;
                                            maxZForX = occupiedLengths[x];
                                            z += bestFitRotation.length;
                                        } else {

                                            fit = false;
                                        }

                                    } else {

                                        z = 0;
                                        y += bestFitRotation.height;
                                        x = 0;
                                        maxZForX = 0;
                                        occupiedLengths = [];
                                        
                                        itemsPerLayerPulp.push(palletsPerLayerPulp);
                                        palletsPerLayerPulp = 0;
                                        layerCountPulp++;
                                    }

                                }

                                if(fit === true){

                                    if (!heightMap[positionKey]) {
                                        heightMap[positionKey] = occupiedHeightAtPosition + bestFitRotation.height;
                                    } else {
                                        heightMap[positionKey] = Math.max(heightMap[positionKey], occupiedHeightAtPosition + bestFitRotation.height);
                                    }
        
                                    var minOccupiedHeight = Math.min.apply(null, Object.values(heightMap)) || 0;
                                    var remainingHeight = binPulp.height - minOccupiedHeight;
        
                                    totPalletsPerLayer++;
                                    previousBox = {
                                        x: x,
                                        y: y,
                                        z: maxZForX,
                                        width: bestFitRotation.width,
                                        height: bestFitRotation.height,
                                        length: bestFitRotation.length
                                    };

                                    packedBoxesPulp.push({
                                        x: x,
                                        y: y,
                                        z: maxZForX, 
                                        originalDimensions: box,
                                        box: bestFitRotation,
                                        color: currentItemColor,
                                        remainingDimensions: {
                                            remainingLength: binPulp.length - (z + bestFitRotation.length),
                                            remainingWidth: binPulp.width - x,
                                            remainingHeight: remainingHeight
                                        },
                                        type: box.type,
                                        product: box.product,
                                        internalId: box.internalId,
                                        weight: box.weight,
                                        maxWeightTon: box.maxWeightTon,
                                        price: box.price,
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
                                        balesPerContainer: box.balesPerContainer,
                                        unitsPerContainer: box.unitsPerContainer,
                                        remainingHeight: remainingHeight,
                                        minOccupiedHeight: minOccupiedHeight,
                                        recommendedItems: box.recommendedItems
                                    });

                                    if (!totalPriceByProductPulp[bestFitRotation.product]) {
                                        totalPriceByProductPulp[bestFitRotation.product] = 0;
                                    }
                                    totalPriceByProductPulp[bestFitRotation.product] += bestFitRotation.price;
                                    grandTotalPulp += bestFitRotation.price;
                                    netWeightPulp += bestFitRotation.weight;
                                    grossWeightPulp += bestFitRotation.weight;
                                    
                                    // maxZForX += bestFitRotation.length;
                                    for (var xi = x; xi < x + bestFitRotation.width; xi++) {
                                        occupiedLengths[xi] = maxZForX + bestFitRotation.length;
                                    }
        
                                    occupiedHeights[positionKey] = Math.max(occupiedHeightAtPosition, occupiedHeightAtPosition + bestFitRotation.height);
                                }
                                x += bestFitRotation.width;
                                
                            } else {

                                currentBox = box;
                                allContainersPulp.push({ packedBoxes: packedBoxesPulp, containerListPulp: containerListPulp });
                                
                                x = 0;
                                y = 0;
                                z = 0;
                                maxZForX = 0;
                                heightMap = {};  
                                packedBoxesPulp = [];
                                occupiedLengths = {};
                                itemsPerLayerPulp = [];
                                itemsPerLayerPulp.push(totPalletsPerLayer);
                                totPalletsPerLayer = 1;
                                layerCountPulp = 0;
                                palletsPerLayerPulp = 0;
                                itemsPerLayerPulp = [];
                                
                                
                                if (canFit({ remainingLength: binPulp.length, remainingWidth: binPulp.width, remainingHeight: binPulp.height }, box)) {
                                    packedBoxesPulp.push({
                                        x: x,
                                        y: y,
                                        z: z,
                                        originalDimensions: box,
                                        box: box,
                                        color: currentItemColor,
                                        remainingDimensions: {
                                            remainingLength: binPulp.length - box.length,
                                            remainingWidth: binPulp.width - box.width,
                                            remainingHeight: binPulp.height - box.height
                                        },
                                        type: box.type,
                                        product: box.product,
                                        internalId: box.internalId,
                                        weight: box.weight,
                                        maxWeightTon: box.maxWeightTon,
                                        layer: layerCountPulp,
                                        netWeight: box.netWeight,
                                        grossWeight: box.grossWeight, 
                                        noOfPallets: 1, 
                                        palletsPerContainer: 0, 
                                        palletsPerLayer: 1,
                                        productLayer: box.layer,
                                        parent: box.parent,
                                        displayName: box.displayName,
                                        balesPerContainer: 0,
                                        unitsPerContainer: 0,
                                        recommendedItems: box.recommendedItems
                                    });
                                    
                                    x += box.width;
                                    log.debug('Placed current box in new container:', box);
                                } else {
                                    log.debug('Current box still cannot fit in the new container:', box);
                                }
                            }
                        } else {

                            currentBox = box;
                            allContainersPulp.push({ packedBoxes: packedBoxesPulp, containerListPulp: containerListPulp });
                            
                            x = 0;
                            y = 0;
                            z = 0;
                            maxZForX = 0;
                            heightMap = {};  
                            packedBoxesPulp = [];
                            occupiedLengths = {};
                            itemsPerLayerPulp = [];
                            itemsPerLayerPulp.push(totPalletsPerLayer);
                            totPalletsPerLayer = 1;
                            layerCountPulp = 0;
                            palletsPerLayerPulp = 0;
                            itemsPerLayerPulp = [];
                            
                            if (canFit({ remainingLength: binPulp.length, remainingWidth: binPulp.width, remainingHeight: binPulp.height }, box)) {
                                packedBoxesPulp.push({
                                    x: x,
                                    y: y,
                                    z: z,
                                    originalDimensions: box,
                                    box: box,
                                    color: currentItemColor,
                                    remainingDimensions: {
                                        remainingLength: binPulp.length - box.length,
                                        remainingWidth: binPulp.width - box.width,
                                        remainingHeight: binPulp.height - box.height
                                    },
                                    type: box.type,
                                    product: box.product,
                                    internalId: box.internalId,
                                    weight: box.weight,
                                    maxWeightTon: box.maxWeightTon,
                                    layer: layerCountPulp,
                                    netWeight: box.netWeight,
                                    grossWeight: box.grossWeight, 
                                    noOfPallets: 1, 
                                    palletsPerContainer: 1, 
                                    palletsPerLayer: 1,
                                    productLayer: box.layer,
                                    parent: box.parent,
                                    displayName: box.displayName,
                                    balesPerContainer: box.balesPerContainer,
                                    unitsPerContainer: box.unitsPerContainer,
                                    recommendedItems: box.recommendedItems
                                });
                                
                                x += box.width;
                                log.debug('Placed current box in new container:', box);
                            } else {
                                log.debug('Current box still cannot fit in the new container:', box);
                            }
                        }
                    }
                });
                
                if (packedBoxesPulp.length > 0) {

                    allContainersPulp.push(
                    {
                        packedBoxes: packedBoxesPulp, 
                        containerListPulp: containerListPulp
                    });
                    
                }

                if (totPalletsPerLayer > 0) {
                    itemsPerLayerPulp.push(totPalletsPerLayer);
                }

                if(balanceHeight > 0 || balanceLength > 0 || balanceWidth > 0) 
                {
                    itemRecommendation = true;
                }
            }

            if (hasBoxCover) {
                var x = 0, y = 0, z = 0; 
                var currentLayerWidth = 0;
                var leftSideWeight = 0;
                var rightSideWeight = 0;
                var boxesThatFitOnX = [];
                var totalWidth = 0;
                var rowNumber = 0;
                var placeOnLeft = true;
                var occupiedHeights = []; 
                var isFirstBox = true;
                var newZ = 0;
                var totalMaxX = 0;
            
                // Get the maximum z value for a given x position
                function getMaxZForX(x, smallestBoxWidth, currentPosition) {
                    var maxZ = 0; 
                    var totalMaxX = 0;
                
                    for (var i = 0; i < packedBoxesBoxCover.length; i++) {
                        var placedBox = packedBoxesBoxCover[i];
                        var previousPlacedBox = packedBoxesBoxCover[i - 1];
                
                        if (placedBox.x === 0) {
                            totalMaxX = placedBox.box.width;
                        } else {
                            totalMaxX += placedBox.box.width;
                        }
                
                        // **Condition 1: Placed at start (X = 0)**
                        if (x === 0 && placedBox.x === 0) {
                            maxZ = Math.max(maxZ, placedBox.z + placedBox.box.length);
                        
                        // **Condition 2: Box placed after another in X direction**
                        } else if (placedBox.x > 0 && placedBox.z === 0) {
                            maxZ = Math.max(maxZ, placedBox.z + placedBox.box.length);
                
                        // **Condition 3: Handling bin width limits and different box sizes**
                        } else if (placedBox.x > 0 && (totalMaxX + smallestBoxWidth > binBoxCover.width || 
                                (previousPlacedBox && previousPlacedBox.box.length > placedBox.box.length))) {
                            if (previousPlacedBox && previousPlacedBox.box.length > placedBox.box.length &&
                                totalMaxX + smallestBoxWidth > binBoxCover.width) {
                                maxZ = Math.max(maxZ, placedBox.z + previousPlacedBox.box.length);
                            } else {
                                maxZ = Math.max(maxZ, placedBox.z + placedBox.box.length);
                            }
                        }
                    }
                    return maxZ;
                }            
            
                var allBoxes = Object.values(boxesBoxCover).flat();

                var minWeight = Math.min.apply(null, allBoxes.map(function (box) {
                    return box.weight;
                }));

                var maxWeight = Math.max.apply(null, allBoxes.map(function (box) {
                    return box.weight;
                }));

                var smallestBoxWidth = Math.min.apply(null, allBoxes.map(function (box) {
                    return box.width;
                }));

                Object.keys(boxesBoxCover).forEach(function (parent) {
                    var items = boxesBoxCover[parent];

                    // Sort items by volume (Largest First)
                    items.sort(function (a, b) {
                        return (b.width * b.length * b.height) - (a.width * a.length * a.height);
                    });

                    var totalNetWeightPerPallet = 0;
                    items.forEach(function (box) {
                        if (box.type === 'box and cover') {
                            totalNetWeightPerPallet += box.netWeightPerPallet;
                        }
                    });

                    items.forEach(function (box) {
                        if (box.type === 'box and cover') {
                            
                            if(box.baseUnitAbbreviation){
                                var baseUnit = box.baseUnitAbbreviation.toLowerCase();
                                box.weight = (box.weight * box.uomConversionRates[baseUnit]) / box.uomConversionRates.ton;
                                box.maxWeightTon = box.weight;
                            }

                            var totalWeight = 0;
                            var palletsPerLayer = Math.floor((binBoxCover.width * binBoxCover.length) / (box.width * box.length)) || 1;
                            var palletsPerContainer = Math.floor(box.weight / (box.netWeightPerPallet / 1000)) || 1;
                            var noOfPallets = Math.floor((box.weight * 1000) / totalNetWeightPerPallet);
                            var palletNetWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                            var grossWeight = (box.grossWeightPerPallet / 1000) * palletsPerContainer;
                            var netWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                            var maxLayers = Math.floor(binBoxCover.height / box.height);
                            var noOfContainers = noOfPallets / palletsPerContainer || 1;

                            var decimalGrossWeight = palletNetWeight + grossWeight;
                            var weight = Math.floor(decimalGrossWeight - palletNetWeight);
                            var pcsPerContainer = Math.floor((weight * 1000) / box.uomConversionRates.pack);

                            if(palletsPerLayer > palletsPerContainer){
                                palletsPerLayer = palletsPerContainer;
                            }

                            // Calculate the total weight of all items
                            totalWeight += box.weight;
                            var recommendedWeight = Math.max(0, box.maxWeightTon - totalWeight);
                
                            if (palletsPerLayer > palletsPerContainer) {
                                palletsPerLayer = palletsPerContainer;
                            }
                
                            // List recommended items if recommendedWeight > 0
                            var recommendedItems = [];
                            if (recommendedWeight > 0) {
                                box.itemRecommendation.forEach(function (item) {
                                    var maxQuantity = Math.floor((recommendedWeight * 1000) / item.netWeightperPallet);
                                    var maxLayers = Math.floor(binBoxCover.height / item.height);
                
                                    if (maxQuantity > 0) {
                                        recommendedItems.push({
                                            name: item.name,
                                            maxQuantity: maxQuantity,
                                            maxLayers: maxLayers,
                                            length: item.length,
                                            width: item.width,
                                            height: item.height,
                                            netWeightperPallet: item.netWeightperPallet,
                                            isPriority: item.name.toLowerCase().includes("double a") ? 1 : 0 // Prioritize Double A brand
                                        });
                                    }
                                });

                                // Sort recommendations by priority first, then by best fit (tightest space)
                                recommendedItems.sort(function (a, b) {
                                    if (b.isPriority !== a.isPriority) {
                                        return b.isPriority - a.isPriority;
                                    }
                                    return (b.length * b.width * b.height) - (a.length * a.width * a.height); 
                                });

                                // Keep only the top 3-5 tightest fitting recommendations
                                recommendedItems = recommendedItems.slice(0, 5);
                            }

                            containerListBoxCover.push({
                                parent: parent,
                                type: box.type,
                                product: box.product,
                                internalId: box.internalId,
                                displayName: box.displayName,
                                weight: box.weight,
                                maxWeightTon: box.maxWeightTon,
                                grossWeight: grossWeight,
                                netWeight: netWeight,
                                pcsPerContainer: pcsPerContainer,
                                noOfPallets: palletsPerContainer,
                                palletsPerContainer: palletsPerContainer,
                                palletsPerLayer: palletsPerLayer,
                                productLayer: box.layer,
                                recommendedItems: recommendedItems
                            });

                            for (var i = 0; i < palletsPerContainer; i++) {

                                boxesBoxCover3D.push({
                                    parent: parent,
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
                                    maxWeightTon: box.maxWeightTon,
                                    netWeightPerPallet: box.netWeightPerPallet,
                                    grossWeightPerPallet: box.grossWeightPerPallet,
                                    pcsPerContainer: pcsPerContainer,
                                    grossWeight: grossWeight,
                                    netWeight: netWeight,
                                    palletsPerContainer: palletsPerContainer,
                                    palletsPerLayer: palletsPerLayer,
                                    maxLayers: maxLayers,
                                    noOfPallets: palletsPerContainer,
                                    noOfContainers: noOfContainers,
                                    recommendedItems: recommendedItems
                                });
                            }
                        }
                    });
                });
                
                var remainingBoxes = null;
                var colorMap = {};
                var occupiedLengths  = [];
                var maxZForX = 0;
                var totPalletsPerLayer = 0;
                var previousBox = null;
                var fit = true;

                boxesBoxCover3D.forEach(function (box, boxIndex) {
            
                    if (box.type === 'box and cover') {
                        if (!colorMap[box.product]) {
                            colorMap[box.product] = colors[Object.keys(colorMap).length % colors.length];
                        }
                        var currentItemColor = colorMap[box.product]; 

                        var rotations = generateLogicalRotations(box);
                        var bestFitRotation = null;
                    
                        // Set up to track the max z for the current x position
                        var positionKey = x + ',' + z; // Create the key as 'x,z'
                        var occupiedHeightAtPosition = occupiedHeights[positionKey] || 0;
                    
                        // Set the initial benchmark using the first box rotation 
                        var firstRotation = rotations[0];
                        var initialRemainingDimensions = {
                            remainingLength: binBoxCover.length - z,
                            remainingWidth: binBoxCover.width - x,
                            remainingHeight: binBoxCover.height - y
                        };
                        
                        var initialRemainingVolume = initialRemainingDimensions.remainingLength * 
                                                    initialRemainingDimensions.remainingWidth * 
                                                    initialRemainingDimensions.remainingHeight;
                        
                        var bestFitRotation = null;
                        if (canFit(initialRemainingDimensions, rotations[0])) {
                            bestFitRotation = rotations[0]; 
                        }
                        
                        // Define the current position before checking fits
                        var currentPosition = {
                            remainingLength: binBoxCover.length - z,
                            remainingWidth: binBoxCover.width - x,  
                            remainingHeight: binBoxCover.height - y
                        };
                        
                        var maxRowHeight = 0;
                        
                        // Find the smallest width and length among all boxes
                        var minBoxWidth = Infinity;
                        var minBoxLength = Infinity;

                        for (var i = 0; i < rotations.length; i++) {
                            if (rotations[i].width < minBoxWidth) {
                                minBoxWidth = rotations[i].width;
                            }
                            if (rotations[i].length < minBoxLength) {
                                minBoxLength = rotations[i].length;
                            }
                        }

                        rotations.forEach(function (rotatedBox) {
                            var remainingWidth = binBoxCover.width - x;
                            var remainingLength = binBoxCover.length - z;
                            var remainingHeight = binBoxCover.height - y;

                            // Check if this is the last box in the row
                            var isLastBoxInRow = remainingWidth <= (minBoxWidth + rotatedBox.width);

                            // Prioritize placing the last box with X > Z if possible
                            if (isLastBoxInRow) {
                                if (rotatedBox.width > rotatedBox.length && x + rotatedBox.width <= binBoxCover.width) {
                                    bestFitRotation = rotatedBox;
                                } 
                                else if (rotatedBox.length > rotatedBox.width && z + rotatedBox.length <= binBoxCover.length) {
                                    bestFitRotation = rotatedBox;
                                }
                            }

                            // Move to a new column if needed
                            if (bestFitRotation && x + bestFitRotation.width > binBoxCover.width) {
                                x = 0;
                                maxZForX += bestFitRotation.length;
                                z = maxZForX;
                            }
                        
                            // Move to a new layer if needed
                            if (bestFitRotation && occupiedLengths[x] + bestFitRotation.length > binBoxCover.length) {
                                var shortestDimension = Math.min(bestFitRotation.width, bestFitRotation.length);
                                var totalCanFit = (binBoxCover.length - occupiedLengths[previousBox.x]) / shortestDimension;
                        
                                if (Math.floor(totalCanFit) >= 1) {
                                    var rotatedWidth = Math.max(bestFitRotation.width, bestFitRotation.length);
                                    var rotatedLength = Math.min(bestFitRotation.width, bestFitRotation.length);
                        
                                    // Try with width > length
                                    if ((z + rotatedLength) <= binBoxCover.length) {
                                        bestFitRotation.width = rotatedWidth;
                                        bestFitRotation.length = rotatedLength;
                                        z -= bestFitRotation.width;
                                        maxZForX -= bestFitRotation.width;
                                    } 
                        
                                    if (z + bestFitRotation.length <= binBoxCover.length) {
                                        x = previousBox.x;
                                        maxZForX = occupiedLengths[x];
                                        z += bestFitRotation.length;
                                    } else {
                                        fit = false;
                                    }
                        
                                } else {
                                    z = 0;
                                    y += bestFitRotation.height;
                                    x = 0;
                                    maxZForX = 0;
                                    occupiedLengths = [];
                        
                                    itemsPerLayerBoxCover.push(palletsPerLayerBoxCover);
                                    palletsPerLayerBoxCover = 0;
                                    layerCountBoxCover++;
                                }

                            }
                        
                            // If no space in X and Z axis, move to a new layer (increase Y)
                            if (!bestFitRotation && y + maxRowHeight + rotatedBox.height <= binBoxCover.height) {

                                var shortestDimension = Math.min(rotatedBox.width, rotatedBox.length);
                                var totalCanFit = (binBoxCover.length - occupiedLengths[previousBox.x]) / shortestDimension;

                                if (Math.floor(totalCanFit) >= 1) {

                                    var rotatedWidth = Math.max(rotatedBox.width, rotatedBox.length);
                                    var rotatedLength = Math.min(rotatedBox.width, rotatedBox.length);

                                    if (z + rotatedLength <= binBoxCover.length) {
                                        rotatedBox.width = rotatedWidth;
                                        rotatedBox.length = rotatedLength;

                                        z -= rotatedBox.width;

                                        maxZForX -= rotatedBox.width;
                                    } 

                                    if(z + rotatedBox.length <= binBoxCover.length){
                                        x = previousBox.x;
                                        maxZForX = occupiedLengths[x];
                                        z += rotatedBox.length;
                                    } else {
                                        fit = false;
                                    }


                                } else {

                                    y += maxRowHeight; 
                                    maxRowHeight = rotatedBox.height;
                                    x = 0;  
                                    z = 0;  
                                }
                                    
                                bestFitRotation = rotatedBox;
                            }
                        
                            // Update available space
                            currentPosition = {
                                remainingLength: binBoxCover.length - z,
                                remainingWidth: binBoxCover.width - x,
                                remainingHeight: binBoxCover.height - y
                            };

                        });

                        var heightMap = {};  
                        if (bestFitRotation) {
                            // Find the max occupied space on the z-axis for the range of x indices
                            for (var xi = x; xi < x + bestFitRotation.width; xi++) {

                                if (occupiedLengths[xi]) {
                                    maxZForX = occupiedLengths[xi];
                                } else {
                                    maxZForX = z;
                                }
                            }

                            var positionKey = x + "," + z;
                            if (!occupiedHeights[positionKey]) {
                                occupiedHeights[positionKey] = 0;
                            }
                        
                            var occupiedHeightAtPosition = occupiedHeights[positionKey];
                            
                            if (y + bestFitRotation.height <= binBoxCover.height) {
                                
                                palletsPerLayerBoxCover++;

                                // move to a new column
                                if (x + bestFitRotation.width > binBoxCover.width) {
                                    x = 0;
                                    maxZForX += bestFitRotation.length;
                                    z = maxZForX;
                                }
                                
                                // move to a new layer
                                if (z + bestFitRotation.length > binBoxCover.length) {
                                    var shortestDimension = Math.min(bestFitRotation.width, bestFitRotation.length);
                                    var totalCanFit = (binBoxCover.length - occupiedLengths[previousBox.x]) / shortestDimension;

                                    if (Math.floor(totalCanFit) >= 1) {

                                        var rotatedWidth = Math.max(bestFitRotation.width, bestFitRotation.length);
                                        var rotatedLength = Math.min(bestFitRotation.width, bestFitRotation.length);

                                        if (z + rotatedLength <= binBoxCover.length) {
                                            bestFitRotation.width = rotatedWidth;
                                            bestFitRotation.length = rotatedLength;

                                            z -= bestFitRotation.width;

                                            maxZForX -= bestFitRotation.width;
                                        } 

                                        if(z + bestFitRotation.length <= binBoxCover.length){
                                            x = previousBox.x;
                                            maxZForX = occupiedLengths[x];
                                            z += bestFitRotation.length;
                                        } else {

                                            fit = false;
                                        }

                                    } else {

                                        z = 0;
                                        y += bestFitRotation.height;
                                        x = 0;
                                        maxZForX = 0;
                                        occupiedLengths = [];
                                        
                                        itemsPerLayerBoxCover.push(palletsPerLayerBoxCover);
                                        palletsPerLayerBoxCover = 0;
                                        layerCountBoxCover++;
                                    }

                                }

                                if(fit === true){

                                    if (!heightMap[positionKey]) {
                                        heightMap[positionKey] = occupiedHeightAtPosition + bestFitRotation.height;
                                    } else {
                                        heightMap[positionKey] = Math.max(heightMap[positionKey], occupiedHeightAtPosition + bestFitRotation.height);
                                    }
        
                                    var minOccupiedHeight = Math.min.apply(null, Object.values(heightMap)) || 0;
                                    var remainingHeight = binBoxCover.height - minOccupiedHeight;
        
                                    totPalletsPerLayer++;
                                    previousBox = {
                                        x: x,
                                        y: y,
                                        z: maxZForX,
                                        width: bestFitRotation.width,
                                        height: bestFitRotation.height,
                                        length: bestFitRotation.length
                                    };

                                    packedBoxesBoxCover.push({
                                        x: x,
                                        y: y,
                                        z: maxZForX, 
                                        originalDimensions: box,
                                        box: bestFitRotation,
                                        color: currentItemColor,
                                        remainingDimensions: {
                                            remainingLength: binBoxCover.length - (z + bestFitRotation.length),
                                            remainingWidth: binBoxCover.width - x,
                                            remainingHeight: remainingHeight
                                        },
                                        type: box.type,
                                        product: box.product,
                                        internalId: box.internalId,
                                        weight: box.weight,
                                        maxWeightTon: box.maxWeightTon,
                                        price: box.price,
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
                                        pcsPerContainer: box.pcsPerContainer,
                                        remainingHeight: remainingHeight,
                                        minOccupiedHeight: minOccupiedHeight,
                                        recommendedItems: box.recommendedItems
                                    });

                                    if (!totalPriceByProductBoxCover[bestFitRotation.product]) {
                                        totalPriceByProductBoxCover[bestFitRotation.product] = 0;
                                    }
                                    totalPriceByProductBoxCover[bestFitRotation.product] += bestFitRotation.price;
                                    grandTotalBoxCover += bestFitRotation.price;
                                    netWeightBoxCover += bestFitRotation.weight;
                                    grossWeightBoxCover += bestFitRotation.weight;
                                    
                                    // maxZForX += bestFitRotation.length;
                                    for (var xi = x; xi < x + bestFitRotation.width; xi++) {
                                        occupiedLengths[xi] = maxZForX + bestFitRotation.length;
                                    }
        
                                    occupiedHeights[positionKey] = Math.max(occupiedHeightAtPosition, occupiedHeightAtPosition + bestFitRotation.height);
                                }
                                x += bestFitRotation.width;
                                
                            } else {

                                currentBox = box;
                                allContainersBoxCover.push({ packedBoxes: packedBoxesBoxCover, containerListBoxCover: containerListBoxCover });
                                
                                x = 0;
                                y = 0;
                                z = 0;
                                maxZForX = 0;
                                heightMap = {};  
                                packedBoxesBoxCover = [];
                                occupiedLengths = {};
                                itemsPerLayerBoxCover = [];
                                itemsPerLayerBoxCover.push(totPalletsPerLayer);
                                totPalletsPerLayer = 1;
                                layerCountBoxCover = 0;
                                palletsPerLayerBoxCover = 0;
                                itemsPerLayerBoxCover = [];
                                
                                
                                if (canFit({ remainingLength: binBoxCover.length, remainingWidth: binBoxCover.width, remainingHeight: binBoxCover.height }, box)) {
                                    packedBoxesBoxCover.push({
                                        x: x,
                                        y: y,
                                        z: z,
                                        originalDimensions: box,
                                        box: box,
                                        color: currentItemColor,
                                        remainingDimensions: {
                                            remainingLength: binBoxCover.length - box.length,
                                            remainingWidth: binBoxCover.width - box.width,
                                            remainingHeight: binBoxCover.height - box.height
                                        },
                                        type: box.type,
                                        product: box.product,
                                        internalId: box.internalId,
                                        weight: box.weight,
                                        maxWeightTon: box.maxWeightTon,
                                        layer: layerCountBoxCover,
                                        netWeight: box.netWeight,
                                        grossWeight: box.grossWeight, 
                                        noOfPallets: 1, 
                                        palletsPerContainer: 0, 
                                        palletsPerLayer: 1,
                                        productLayer: box.layer,
                                        parent: box.parent,
                                        displayName: box.displayName,
                                        pcsPerContainer: 0,
                                        recommendedItems: box.recommendedItems
                                    });
                                    
                                    x += box.width;
                                    log.debug('Placed current box in new container:', box);
                                } else {
                                    log.debug('Current box still cannot fit in the new container:', box);
                                }
                            }
                        } else {

                            currentBox = box;
                            allContainersBoxCover.push({ packedBoxes: packedBoxesBoxCover, containerListBoxCover: containerListBoxCover });
                            
                            x = 0;
                            y = 0;
                            z = 0;
                            maxZForX = 0;
                            heightMap = {};  
                            packedBoxesBoxCover = [];
                            occupiedLengths = {};
                            itemsPerLayerBoxCover = [];
                            itemsPerLayerBoxCover.push(totPalletsPerLayer);
                            totPalletsPerLayer = 1;
                            layerCountBoxCover = 0;
                            palletsPerLayerBoxCover = 0;
                            itemsPerLayerBoxCover = [];
                            
                            if (canFit({ remainingLength: binBoxCover.length, remainingWidth: binBoxCover.width, remainingHeight: binBoxCover.height }, box)) {
                                packedBoxesBoxCover.push({
                                    x: x,
                                    y: y,
                                    z: z,
                                    originalDimensions: box,
                                    box: box,
                                    color: currentItemColor,
                                    remainingDimensions: {
                                        remainingLength: binBoxCover.length - box.length,
                                        remainingWidth: binBoxCover.width - box.width,
                                        remainingHeight: binBoxCover.height - box.height
                                    },
                                    type: box.type,
                                    product: box.product,
                                    internalId: box.internalId,
                                    weight: box.weight,
                                    maxWeightTon: box.maxWeightTon,
                                    layer: layerCountBoxCover,
                                    netWeight: box.netWeight,
                                    grossWeight: box.grossWeight, 
                                    noOfPallets: 1, 
                                    palletsPerContainer: 1, 
                                    palletsPerLayer: 1,
                                    productLayer: box.layer,
                                    parent: box.parent,
                                    displayName: box.displayName,
                                    pcsPerContainer: box.pcsPerContainer,
                                    recommendedItems: box.recommendedItems
                                });
                                
                                x += box.width;
                                log.debug('Placed current box in new container:', box);
                            } else {
                                log.debug('Current box still cannot fit in the new container:', box);
                            }
                        }
                    }
                });
                
                if (packedBoxesBoxCover.length > 0) {

                    allContainersBoxCover.push(
                    {
                        packedBoxes: packedBoxesBoxCover, 
                        containerListBoxCover: containerListBoxCover
                    });
                    
                }

                if (totPalletsPerLayer > 0) {
                    itemsPerLayerBoxCover.push(totPalletsPerLayer);
                }

                if(balanceHeight > 0 || balanceLength > 0 || balanceWidth > 0) 
                {
                    itemRecommendation = true;
                }
            }

            if (hasDAN) {
                var x = 0, y = 0, z = 0; 
                var currentLayerWidth = 0;
                var leftSideWeight = 0;
                var rightSideWeight = 0;
                var boxesThatFitOnX = [];
                var totalWidth = 0;
                var rowNumber = 0;
                var placeOnLeft = true;
                var occupiedHeights = []; 
                var isFirstBox = true;
                var newZ = 0;
                var totalMaxX = 0;
            
                // Get the maximum z value for a given x position
                function getMaxZForX(x, smallestBoxWidth, currentPosition) {
                    var maxZ = 0; 
                    var totalMaxX = 0;
                
                    for (var i = 0; i < packedBoxesDAN.length; i++) {
                        var placedBox = packedBoxesDAN[i];
                        var previousPlacedBox = packedBoxesDAN[i - 1];
                
                        if (placedBox.x === 0) {
                            totalMaxX = placedBox.box.width;
                        } else {
                            totalMaxX += placedBox.box.width;
                        }
                
                        // **Condition 1: Placed at start (X = 0)**
                        if (x === 0 && placedBox.x === 0) {
                            maxZ = Math.max(maxZ, placedBox.z + placedBox.box.length);
                        
                        // **Condition 2: Box placed after another in X direction**
                        } else if (placedBox.x > 0 && placedBox.z === 0) {
                            maxZ = Math.max(maxZ, placedBox.z + placedBox.box.length);
                
                        // **Condition 3: Handling bin width limits and different box sizes**
                        } else if (placedBox.x > 0 && (totalMaxX + smallestBoxWidth > binDAN.width || 
                                (previousPlacedBox && previousPlacedBox.box.length > placedBox.box.length))) {
                            if (previousPlacedBox && previousPlacedBox.box.length > placedBox.box.length &&
                                totalMaxX + smallestBoxWidth > binDAN.width) {
                                maxZ = Math.max(maxZ, placedBox.z + previousPlacedBox.box.length);
                            } else {
                                maxZ = Math.max(maxZ, placedBox.z + placedBox.box.length);
                            }
                        }
                    }
                    return maxZ;
                }            
            
                var allBoxes = Object.values(boxesDAN).flat();

                var minWeight = Math.min.apply(null, allBoxes.map(function (box) {
                    return box.weight;
                }));

                var maxWeight = Math.max.apply(null, allBoxes.map(function (box) {
                    return box.weight;
                }));

                var smallestBoxWidth = Math.min.apply(null, allBoxes.map(function (box) {
                    return box.width;
                }));

                Object.keys(boxesDAN).forEach(function (parent) {
                    var items = boxesDAN[parent];

                    // Sort items by volume (Largest First)
                    items.sort(function (a, b) {
                        return (b.width * b.length * b.height) - (a.width * a.length * a.height);
                    });

                    var totalNetWeightPerPallet = 0;
                    items.forEach(function (box) {
                        if (box.type === 'double a notebook') {
                            totalNetWeightPerPallet += box.netWeightPerPallet;
                        }
                    });

                    items.forEach(function (box) {
                        if (box.type === 'double a notebook') {
                            
                            if(box.baseUnitAbbreviation){
                                var baseUnit = box.baseUnitAbbreviation.toLowerCase();
                                box.weight = (box.weight * box.uomConversionRates[baseUnit]) / box.uomConversionRates.ton;
                                box.maxWeightTon = box.weight;
                            }
                            
                            var totalWeight = 0;
                            var palletsPerLayer = Math.floor((binDAN.width * binDAN.length) / (box.width * box.length)) || 1;
                            var palletsPerContainer = Math.floor(box.weight / (box.netWeightPerPallet / 1000)) || 1;
                            var noOfPallets = Math.floor((box.weight * 1000) / totalNetWeightPerPallet);
                            var palletNetWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                            var grossWeight = (box.grossWeightPerPallet / 1000) * palletsPerContainer;
                            var netWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                            var maxLayers = Math.floor(binDAN.height / box.height);
                            var noOfContainers = noOfPallets / palletsPerContainer || 1;

                            var decimalGrossWeight = palletNetWeight + grossWeight;
                            var weight = Math.floor(decimalGrossWeight - palletNetWeight);
                            var reamsPerContainer = Math.floor((weight * 1000) / box.uomConversionRates.ream);
                            var boxesPerContainer = Math.floor((weight * 1000) / box.uomConversionRates.box);
                            var packsPerContainer = Math.floor((weight * 1000) / box.uomConversionRates.pack);

                            if(palletsPerLayer > palletsPerContainer){
                                palletsPerLayer = palletsPerContainer;
                            }

                            // Calculate the total weight of all items
                            totalWeight += box.weight;
                            var recommendedWeight = Math.max(0, box.maxWeightTon - totalWeight);
                
                            if (palletsPerLayer > palletsPerContainer) {
                                palletsPerLayer = palletsPerContainer;
                            }
                
                            // List recommended items if recommendedWeight > 0
                            var recommendedItems = [];
                            if (recommendedWeight > 0) {
                                box.itemRecommendation.forEach(function (item) {
                                    var maxQuantity = Math.floor((recommendedWeight * 1000) / item.netWeightperPallet);
                                    var maxLayers = Math.floor(binDAN.height / item.height);
                
                                    if (maxQuantity > 0) {
                                        recommendedItems.push({
                                            name: item.name,
                                            maxQuantity: maxQuantity,
                                            maxLayers: maxLayers,
                                            length: item.length,
                                            width: item.width,
                                            height: item.height,
                                            netWeightperPallet: item.netWeightperPallet,
                                            isPriority: item.name.toLowerCase().includes("double a") ? 1 : 0 // Prioritize Double A brand
                                        });
                                    }
                                });

                                // Sort recommendations by priority first, then by best fit (tightest space)
                                recommendedItems.sort(function (a, b) {
                                    if (b.isPriority !== a.isPriority) {
                                        return b.isPriority - a.isPriority;
                                    }
                                    return (b.length * b.width * b.height) - (a.length * a.width * a.height); 
                                });

                                // Keep only the top 3-5 tightest fitting recommendations
                                recommendedItems = recommendedItems.slice(0, 5);
                            }

                            containerListDAN.push({
                                parent: parent,
                                type: box.type,
                                product: box.product,
                                internalId: box.internalId,
                                displayName: box.displayName,
                                weight: box.weight,
                                maxWeightTon: box.maxWeightTon,
                                grossWeight: grossWeight,
                                netWeight: netWeight,
                                reamsPerContainer: reamsPerContainer,
                                noOfPallets: palletsPerContainer,
                                palletsPerContainer: palletsPerContainer,
                                palletsPerLayer: palletsPerLayer,
                                productLayer: box.layer,
                                boxesPerContainer: boxesPerContainer,
                                packsPerContainer: packsPerContainer,
                                recommendedItems: recommendedItems
                            });

                            for (var i = 0; i < palletsPerContainer; i++) {

                                boxesDAN3D.push({
                                    parent: parent,
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
                                    maxWeightTon: box.maxWeightTon,
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
                                    packsPerContainer: packsPerContainer,
                                    recommendedItems: recommendedItems
                                });
                            }
                        }
                    });
                });
                
                var remainingBoxes = null;
                var colorMap = {};
                var occupiedLengths  = [];
                var maxZForX = 0;
                var totPalletsPerLayer = 0;
                var previousBox = null;
                var fit = true;

                boxesDAN3D.forEach(function (box, boxIndex) {
            
                    if (box.type === 'double a notebook') {
                        if (!colorMap[box.product]) {
                            colorMap[box.product] = colors[Object.keys(colorMap).length % colors.length];
                        }
                        var currentItemColor = colorMap[box.product]; 

                        var rotations = generateLogicalRotations(box);
                        var bestFitRotation = null;
                    
                        // Set up to track the max z for the current x position
                        var positionKey = x + ',' + z; // Create the key as 'x,z'
                        var occupiedHeightAtPosition = occupiedHeights[positionKey] || 0;
                    
                        // Set the initial benchmark using the first box rotation 
                        var firstRotation = rotations[0];
                        var initialRemainingDimensions = {
                            remainingLength: binDAN.length - z,
                            remainingWidth: binDAN.width - x,
                            remainingHeight: binDAN.height - y
                        };
                        
                        var initialRemainingVolume = initialRemainingDimensions.remainingLength * 
                                                    initialRemainingDimensions.remainingWidth * 
                                                    initialRemainingDimensions.remainingHeight;
                        
                        var bestFitRotation = null;
                        if (canFit(initialRemainingDimensions, rotations[0])) {
                            bestFitRotation = rotations[0]; 
                        }
                        
                        // Define the current position before checking fits
                        var currentPosition = {
                            remainingLength: binDAN.length - z,
                            remainingWidth: binDAN.width - x,  
                            remainingHeight: binDAN.height - y
                        };
                        
                        var maxRowHeight = 0;
                        
                        // Find the smallest width and length among all boxes
                        var minBoxWidth = Infinity;
                        var minBoxLength = Infinity;

                        for (var i = 0; i < rotations.length; i++) {
                            if (rotations[i].width < minBoxWidth) {
                                minBoxWidth = rotations[i].width;
                            }
                            if (rotations[i].length < minBoxLength) {
                                minBoxLength = rotations[i].length;
                            }
                        }

                        rotations.forEach(function (rotatedBox) {
                            var remainingWidth = binDAN.width - x;
                            var remainingLength = binDAN.length - z;
                            var remainingHeight = binDAN.height - y;

                            // Check if this is the last box in the row
                            var isLastBoxInRow = remainingWidth <= (minBoxWidth + rotatedBox.width);

                            // Prioritize placing the last box with X > Z if possible
                            if (isLastBoxInRow) {
                                if (rotatedBox.width > rotatedBox.length && x + rotatedBox.width <= binDAN.width) {
                                    bestFitRotation = rotatedBox;
                                } 
                                else if (rotatedBox.length > rotatedBox.width && z + rotatedBox.length <= binDAN.length) {
                                    bestFitRotation = rotatedBox;
                                }
                            }

                            // Move to a new column if needed
                            if (bestFitRotation && x + bestFitRotation.width > binDAN.width) {
                                x = 0;
                                maxZForX += bestFitRotation.length;
                                z = maxZForX;
                            }
                        
                            // Move to a new layer if needed
                            if (bestFitRotation && occupiedLengths[x] + bestFitRotation.length > binDAN.length) {
                                var shortestDimension = Math.min(bestFitRotation.width, bestFitRotation.length);
                                var totalCanFit = (binDAN.length - occupiedLengths[previousBox.x]) / shortestDimension;
                        
                                if (Math.floor(totalCanFit) >= 1) {
                                    var rotatedWidth = Math.max(bestFitRotation.width, bestFitRotation.length);
                                    var rotatedLength = Math.min(bestFitRotation.width, bestFitRotation.length);
                        
                                    // Try with width > length
                                    if ((z + rotatedLength) <= binDAN.length) {
                                        bestFitRotation.width = rotatedWidth;
                                        bestFitRotation.length = rotatedLength;
                                        z -= bestFitRotation.width;
                                        maxZForX -= bestFitRotation.width;
                                    } 
                        
                                    if (z + bestFitRotation.length <= binDAN.length) {
                                        x = previousBox.x;
                                        maxZForX = occupiedLengths[x];
                                        z += bestFitRotation.length;
                                    } else {
                                        fit = false;
                                    }
                        
                                } else {
                                    z = 0;
                                    y += bestFitRotation.height;
                                    x = 0;
                                    maxZForX = 0;
                                    occupiedLengths = [];
                        
                                    itemsPerLayerDAN.push(palletsPerLayerDAN);
                                    palletsPerLayerDAN = 0;
                                    layerCountDAN++;
                                }

                            }
                        
                            // If no space in X and Z axis, move to a new layer (increase Y)
                            if (!bestFitRotation && y + maxRowHeight + rotatedBox.height <= binDAN.height) {

                                var shortestDimension = Math.min(rotatedBox.width, rotatedBox.length);
                                var totalCanFit = (binDAN.length - occupiedLengths[previousBox.x]) / shortestDimension;

                                if (Math.floor(totalCanFit) >= 1) {

                                    var rotatedWidth = Math.max(rotatedBox.width, rotatedBox.length);
                                    var rotatedLength = Math.min(rotatedBox.width, rotatedBox.length);

                                    if (z + rotatedLength <= binDAN.length) {
                                        rotatedBox.width = rotatedWidth;
                                        rotatedBox.length = rotatedLength;

                                        z -= rotatedBox.width;

                                        maxZForX -= rotatedBox.width;
                                    } 

                                    if(z + rotatedBox.length <= binDAN.length){
                                        x = previousBox.x;
                                        maxZForX = occupiedLengths[x];
                                        z += rotatedBox.length;
                                    } else {
                                        fit = false;
                                    }


                                } else {

                                    y += maxRowHeight; 
                                    maxRowHeight = rotatedBox.height;
                                    x = 0;  
                                    z = 0;  
                                }
                                    
                                bestFitRotation = rotatedBox;
                            }
                        
                            // Update available space
                            currentPosition = {
                                remainingLength: binDAN.length - z,
                                remainingWidth: binDAN.width - x,
                                remainingHeight: binDAN.height - y
                            };

                        });

                        var heightMap = {};  
                        if (bestFitRotation) {
                            // Find the max occupied space on the z-axis for the range of x indices
                            for (var xi = x; xi < x + bestFitRotation.width; xi++) {

                                if (occupiedLengths[xi]) {
                                    maxZForX = occupiedLengths[xi];
                                } else {
                                    maxZForX = z;
                                }
                            }

                            var positionKey = x + "," + z;
                            if (!occupiedHeights[positionKey]) {
                                occupiedHeights[positionKey] = 0;
                            }
                        
                            var occupiedHeightAtPosition = occupiedHeights[positionKey];
                            
                            if (y + bestFitRotation.height <= binDAN.height) {
                                
                                palletsPerLayerDAN++;

                                // move to a new column
                                if (x + bestFitRotation.width > binDAN.width) {
                                    x = 0;
                                    maxZForX += bestFitRotation.length;
                                    z = maxZForX;
                                }
                                
                                // move to a new layer
                                if (z + bestFitRotation.length > binDAN.length) {
                                    var shortestDimension = Math.min(bestFitRotation.width, bestFitRotation.length);
                                    var totalCanFit = (binDAN.length - occupiedLengths[previousBox.x]) / shortestDimension;

                                    if (Math.floor(totalCanFit) >= 1) {

                                        var rotatedWidth = Math.max(bestFitRotation.width, bestFitRotation.length);
                                        var rotatedLength = Math.min(bestFitRotation.width, bestFitRotation.length);

                                        if (z + rotatedLength <= binDAN.length) {
                                            bestFitRotation.width = rotatedWidth;
                                            bestFitRotation.length = rotatedLength;

                                            z -= bestFitRotation.width;

                                            maxZForX -= bestFitRotation.width;
                                        } 

                                        if(z + bestFitRotation.length <= binDAN.length){
                                            x = previousBox.x;
                                            maxZForX = occupiedLengths[x];
                                            z += bestFitRotation.length;
                                        } else {

                                            fit = false;
                                        }

                                    } else {

                                        z = 0;
                                        y += bestFitRotation.height;
                                        x = 0;
                                        maxZForX = 0;
                                        occupiedLengths = [];
                                        
                                        itemsPerLayerDAN.push(palletsPerLayerDAN);
                                        palletsPerLayerDAN = 0;
                                        layerCountDAN++;
                                    }

                                }

                                if(fit === true){

                                    if (!heightMap[positionKey]) {
                                        heightMap[positionKey] = occupiedHeightAtPosition + bestFitRotation.height;
                                    } else {
                                        heightMap[positionKey] = Math.max(heightMap[positionKey], occupiedHeightAtPosition + bestFitRotation.height);
                                    }
        
                                    var minOccupiedHeight = Math.min.apply(null, Object.values(heightMap)) || 0;
                                    var remainingHeight = binDAN.height - minOccupiedHeight;
        
                                    totPalletsPerLayer++;
                                    previousBox = {
                                        x: x,
                                        y: y,
                                        z: maxZForX,
                                        width: bestFitRotation.width,
                                        height: bestFitRotation.height,
                                        length: bestFitRotation.length
                                    };

                                    packedBoxesDAN.push({
                                        x: x,
                                        y: y,
                                        z: maxZForX, 
                                        originalDimensions: box,
                                        box: bestFitRotation,
                                        color: currentItemColor,
                                        remainingDimensions: {
                                            remainingLength: binDAN.length - (z + bestFitRotation.length),
                                            remainingWidth: binDAN.width - x,
                                            remainingHeight: remainingHeight
                                        },
                                        type: box.type,
                                        product: box.product,
                                        internalId: box.internalId,
                                        weight: box.weight,
                                        maxWeightTon: box.maxWeightTon,
                                        price: box.price,
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
                                        packsPerContainer: box.packsPerContainer,
                                        remainingHeight: remainingHeight,
                                        minOccupiedHeight: minOccupiedHeight,
                                        recommendedItems: box.recommendedItems
                                    });

                                    if (!totalPriceByProductDAN[bestFitRotation.product]) {
                                        totalPriceByProductDAN[bestFitRotation.product] = 0;
                                    }
                                    totalPriceByProductDAN[bestFitRotation.product] += bestFitRotation.price;
                                    grandTotalDAN += bestFitRotation.price;
                                    netWeightDAN += bestFitRotation.weight;
                                    grossWeightDAN += bestFitRotation.weight;
                                    
                                    // maxZForX += bestFitRotation.length;
                                    for (var xi = x; xi < x + bestFitRotation.width; xi++) {
                                        occupiedLengths[xi] = maxZForX + bestFitRotation.length;
                                    }
        
                                    occupiedHeights[positionKey] = Math.max(occupiedHeightAtPosition, occupiedHeightAtPosition + bestFitRotation.height);
                                }
                                x += bestFitRotation.width;
                                
                            } else {

                                currentBox = box;
                                allContainersDAN.push({ packedBoxes: packedBoxesDAN, containerListDAN: containerListDAN });
                                
                                x = 0;
                                y = 0;
                                z = 0;
                                maxZForX = 0;
                                heightMap = {};  
                                packedBoxesDAN = [];
                                occupiedLengths = {};
                                itemsPerLayerDAN = [];
                                itemsPerLayerDAN.push(totPalletsPerLayer);
                                totPalletsPerLayer = 1;
                                layerCountDAN = 0;
                                palletsPerLayerDAN = 0;
                                itemsPerLayerDAN = [];
                                
                                
                                if (canFit({ remainingLength: binDAN.length, remainingWidth: binDAN.width, remainingHeight: binDAN.height }, box)) {
                                    packedBoxesDAN.push({
                                        x: x,
                                        y: y,
                                        z: z,
                                        originalDimensions: box,
                                        box: box,
                                        color: currentItemColor,
                                        remainingDimensions: {
                                            remainingLength: binDAN.length - box.length,
                                            remainingWidth: binDAN.width - box.width,
                                            remainingHeight: binDAN.height - box.height
                                        },
                                        type: box.type,
                                        product: box.product,
                                        internalId: box.internalId,
                                        weight: box.weight,
                                        maxWeightTon: box.maxWeightTon,
                                        layer: layerCountDAN,
                                        netWeight: box.netWeight,
                                        grossWeight: box.grossWeight, 
                                        noOfPallets: 1, 
                                        palletsPerContainer: 0, 
                                        palletsPerLayer: 1,
                                        productLayer: box.layer,
                                        parent: box.parent,
                                        displayName: box.displayName,
                                        reamsPerContainer: 0,
                                        boxesPerContainer: 0,
                                        packsPerContainer: 0,
                                        recommendedItems: box.recommendedItems
                                    });
                                    
                                    x += box.width;
                                    log.debug('Placed current box in new container:', box);
                                } else {
                                    log.debug('Current box still cannot fit in the new container:', box);
                                }
                            }
                        } else {

                            currentBox = box;
                            allContainersDAN.push({ packedBoxes: packedBoxesDAN, containerListDAN: containerListDAN });
                            
                            x = 0;
                            y = 0;
                            z = 0;
                            maxZForX = 0;
                            heightMap = {};  
                            packedBoxesDAN = [];
                            occupiedLengths = {};
                            itemsPerLayerDAN = [];
                            itemsPerLayerDAN.push(totPalletsPerLayer);
                            totPalletsPerLayer = 1;
                            layerCountDAN = 0;
                            palletsPerLayerDAN = 0;
                            itemsPerLayerDAN = [];
                            
                            if (canFit({ remainingLength: binDAN.length, remainingWidth: binDAN.width, remainingHeight: binDAN.height }, box)) {
                                packedBoxesDAN.push({
                                    x: x,
                                    y: y,
                                    z: z,
                                    originalDimensions: box,
                                    box: box,
                                    color: currentItemColor,
                                    remainingDimensions: {
                                        remainingLength: binDAN.length - box.length,
                                        remainingWidth: binDAN.width - box.width,
                                        remainingHeight: binDAN.height - box.height
                                    },
                                    type: box.type,
                                    product: box.product,
                                    internalId: box.internalId,
                                    weight: box.weight,
                                    maxWeightTon: box.maxWeightTon,
                                    layer: layerCountDAN,
                                    netWeight: box.netWeight,
                                    grossWeight: box.grossWeight, 
                                    noOfPallets: 1, 
                                    palletsPerContainer: 1, 
                                    palletsPerLayer: 1,
                                    productLayer: box.layer,
                                    parent: box.parent,
                                    displayName: box.displayName,
                                    reamsPerContainer: box.reamsPerContainer,
                                    boxesPerContainer: box.boxesPerContainer,
                                    packsPerContainer: box.packsPerContainer,
                                    recommendedItems: box.recommendedItems
                                });
                                
                                x += box.width;
                                log.debug('Placed current box in new container:', box);
                            } else {
                                log.debug('Current box still cannot fit in the new container:', box);
                            }
                        }
                    }
                });
                
                if (packedBoxesDAN.length > 0) {

                    allContainersDAN.push(
                    {
                        packedBoxes: packedBoxesDAN, 
                        containerListDAN: containerListDAN
                    });
                    
                }

                if (totPalletsPerLayer > 0) {
                    itemsPerLayerDAN.push(totPalletsPerLayer);
                }

                if(balanceHeight > 0 || balanceLength > 0 || balanceWidth > 0) 
                {
                    itemRecommendation = true;
                }
            }

            if (hasDAOS) {
                var x = 0, y = 0, z = 0; 
                var currentLayerWidth = 0;
                var leftSideWeight = 0;
                var rightSideWeight = 0;
                var boxesThatFitOnX = [];
                var totalWidth = 0;
                var rowNumber = 0;
                var placeOnLeft = true;
                var occupiedHeights = []; 
                var isFirstBox = true;
                var newZ = 0;
                var totalMaxX = 0;
            
                // Get the maximum z value for a given x position
                function getMaxZForX(x, smallestBoxWidth, currentPosition) {
                    var maxZ = 0; 
                    var totalMaxX = 0;
                
                    for (var i = 0; i < packedBoxesDAOS.length; i++) {
                        var placedBox = packedBoxesDAOS[i];
                        var previousPlacedBox = packedBoxesDAOS[i - 1];
                
                        if (placedBox.x === 0) {
                            totalMaxX = placedBox.box.width;
                        } else {
                            totalMaxX += placedBox.box.width;
                        }
                
                        // **Condition 1: Placed at start (X = 0)**
                        if (x === 0 && placedBox.x === 0) {
                            maxZ = Math.max(maxZ, placedBox.z + placedBox.box.length);
                        
                        // **Condition 2: Box placed after another in X direction**
                        } else if (placedBox.x > 0 && placedBox.z === 0) {
                            maxZ = Math.max(maxZ, placedBox.z + placedBox.box.length);
                
                        // **Condition 3: Handling bin width limits and different box sizes**
                        } else if (placedBox.x > 0 && (totalMaxX + smallestBoxWidth > binDAOS.width || 
                                (previousPlacedBox && previousPlacedBox.box.length > placedBox.box.length))) {
                            if (previousPlacedBox && previousPlacedBox.box.length > placedBox.box.length &&
                                totalMaxX + smallestBoxWidth > binDAOS.width) {
                                maxZ = Math.max(maxZ, placedBox.z + previousPlacedBox.box.length);
                            } else {
                                maxZ = Math.max(maxZ, placedBox.z + placedBox.box.length);
                            }
                        }
                    }
                    return maxZ;
                }            
            
                var allBoxes = Object.values(boxesDAOS).flat();

                var minWeight = Math.min.apply(null, allBoxes.map(function (box) {
                    return box.weight;
                }));

                var maxWeight = Math.max.apply(null, allBoxes.map(function (box) {
                    return box.weight;
                }));

                var smallestBoxWidth = Math.min.apply(null, allBoxes.map(function (box) {
                    return box.width;
                }));

                Object.keys(boxesDAOS).forEach(function (parent) {
                    var items = boxesDAOS[parent];

                    // Sort items by volume (Largest First)
                    items.sort(function (a, b) {
                        return (b.width * b.length * b.height) - (a.width * a.length * a.height);
                    });

                    var totalNetWeightPerPallet = 0;
                    items.forEach(function (box) {
                        if (box.type === 'double a office supply') {
                            totalNetWeightPerPallet += box.netWeightPerPallet;
                        }
                    });

                    items.forEach(function (box) {
                        if (box.type === 'double a office supply') {
                            
                            if(box.baseUnitAbbreviation){
                                var baseUnit = box.baseUnitAbbreviation.toLowerCase();
                                box.weight = (box.weight * box.uomConversionRates[baseUnit]) / box.uomConversionRates.ton;
                                box.maxWeightTon = box.weight;
                            }

                            var totalWeight = 0;
                            var palletsPerLayer = Math.floor((binDAOS.width * binDAOS.length) / (box.width * box.length)) || 1;
                            var palletsPerContainer = Math.floor(box.weight / (box.netWeightPerPallet / 1000)) || 1;
                            var noOfPallets = Math.floor((box.weight * 1000) / totalNetWeightPerPallet);
                            var palletNetWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                            var grossWeight = (box.grossWeightPerPallet / 1000) * palletsPerContainer;
                            var netWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                            var maxLayers = Math.floor(binDAOS.height / box.height);
                            var noOfContainers = noOfPallets / palletsPerContainer || 1;

                            var decimalGrossWeight = palletNetWeight + grossWeight;
                            var weight = Math.floor(decimalGrossWeight - palletNetWeight);
                            var reamsPerContainer = Math.floor((weight * 1000) / box.uomConversionRates.ream);
                            var boxesPerContainer = Math.floor((weight * 1000) / box.uomConversionRates.box);
                            var packsPerContainer = Math.floor((weight * 1000) / box.uomConversionRates.pack);

                            if(palletsPerLayer > palletsPerContainer){
                                palletsPerLayer = palletsPerContainer;
                            }

                            // Calculate the total weight of all items
                            totalWeight += box.weight;
                            var recommendedWeight = Math.max(0, box.maxWeightTon - totalWeight);
                
                            if (palletsPerLayer > palletsPerContainer) {
                                palletsPerLayer = palletsPerContainer;
                            }
                
                            // List recommended items if recommendedWeight > 0
                            var recommendedItems = [];
                            if (recommendedWeight > 0) {
                                box.itemRecommendation.forEach(function (item) {
                                    var maxQuantity = Math.floor((recommendedWeight * 1000) / item.netWeightperPallet);
                                    var maxLayers = Math.floor(binDAOS.height / item.height);
                
                                    if (maxQuantity > 0) {
                                        recommendedItems.push({
                                            name: item.name,
                                            maxQuantity: maxQuantity,
                                            maxLayers: maxLayers,
                                            length: item.length,
                                            width: item.width,
                                            height: item.height,
                                            netWeightperPallet: item.netWeightperPallet,
                                            isPriority: item.name.toLowerCase().includes("double a") ? 1 : 0 // Prioritize Double A brand
                                        });
                                    }
                                });

                                // Sort recommendations by priority first, then by best fit (tightest space)
                                recommendedItems.sort(function (a, b) {
                                    if (b.isPriority !== a.isPriority) {
                                        return b.isPriority - a.isPriority;
                                    }
                                    return (b.length * b.width * b.height) - (a.length * a.width * a.height); 
                                });

                                // Keep only the top 3-5 tightest fitting recommendations
                                recommendedItems = recommendedItems.slice(0, 5);
                            }

                            containerListDAOS.push({
                                parent: parent,
                                type: box.type,
                                product: box.product,
                                internalId: box.internalId,
                                displayName: box.displayName,
                                weight: box.weight,
                                maxWeightTon: box.maxWeightTon,
                                grossWeight: grossWeight,
                                netWeight: netWeight,
                                reamsPerContainer: reamsPerContainer,
                                noOfPallets: palletsPerContainer,
                                palletsPerContainer: palletsPerContainer,
                                palletsPerLayer: palletsPerLayer,
                                productLayer: box.layer,
                                boxesPerContainer: boxesPerContainer,
                                packsPerContainer: packsPerContainer,
                                recommendedItems: recommendedItems
                            });

                            for (var i = 0; i < palletsPerContainer; i++) {

                                boxesDAOS3D.push({
                                    parent: parent,
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
                                    maxWeightTon: box.maxWeightTon,
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
                                    packsPerContainer: packsPerContainer,
                                    recommendedItems: recommendedItems
                                });
                            }
                        }
                    });
                });
                
                var remainingBoxes = null;
                var colorMap = {};
                var occupiedLengths  = [];
                var maxZForX = 0;
                var totPalletsPerLayer = 0;
                var previousBox = null;
                var fit = true;

                boxesDAOS3D.forEach(function (box, boxIndex) {
            
                    if (box.type === 'double a office supply') {
                        if (!colorMap[box.product]) {
                            colorMap[box.product] = colors[Object.keys(colorMap).length % colors.length];
                        }
                        var currentItemColor = colorMap[box.product]; 

                        var rotations = generateLogicalRotations(box);
                        var bestFitRotation = null;
                    
                        // Set up to track the max z for the current x position
                        var positionKey = x + ',' + z; // Create the key as 'x,z'
                        var occupiedHeightAtPosition = occupiedHeights[positionKey] || 0;
                    
                        // Set the initial benchmark using the first box rotation 
                        var firstRotation = rotations[0];
                        var initialRemainingDimensions = {
                            remainingLength: binDAOS.length - z,
                            remainingWidth: binDAOS.width - x,
                            remainingHeight: binDAOS.height - y
                        };
                        
                        var initialRemainingVolume = initialRemainingDimensions.remainingLength * 
                                                    initialRemainingDimensions.remainingWidth * 
                                                    initialRemainingDimensions.remainingHeight;
                        
                        var bestFitRotation = null;
                        if (canFit(initialRemainingDimensions, rotations[0])) {
                            bestFitRotation = rotations[0]; 
                        }
                        
                        // Define the current position before checking fits
                        var currentPosition = {
                            remainingLength: binDAOS.length - z,
                            remainingWidth: binDAOS.width - x,  
                            remainingHeight: binDAOS.height - y
                        };
                        
                        var maxRowHeight = 0;
                        
                        // Find the smallest width and length among all boxes
                        var minBoxWidth = Infinity;
                        var minBoxLength = Infinity;

                        for (var i = 0; i < rotations.length; i++) {
                            if (rotations[i].width < minBoxWidth) {
                                minBoxWidth = rotations[i].width;
                            }
                            if (rotations[i].length < minBoxLength) {
                                minBoxLength = rotations[i].length;
                            }
                        }

                        rotations.forEach(function (rotatedBox) {
                            var remainingWidth = binDAOS.width - x;
                            var remainingLength = binDAOS.length - z;
                            var remainingHeight = binDAOS.height - y;

                            // Check if this is the last box in the row
                            var isLastBoxInRow = remainingWidth <= (minBoxWidth + rotatedBox.width);

                            // Prioritize placing the last box with X > Z if possible
                            if (isLastBoxInRow) {
                                if (rotatedBox.width > rotatedBox.length && x + rotatedBox.width <= binDAOS.width) {
                                    bestFitRotation = rotatedBox;
                                } 
                                else if (rotatedBox.length > rotatedBox.width && z + rotatedBox.length <= binDAOS.length) {
                                    bestFitRotation = rotatedBox;
                                }
                            }

                            // Move to a new column if needed
                            if (bestFitRotation && x + bestFitRotation.width > binDAOS.width) {
                                x = 0;
                                maxZForX += bestFitRotation.length;
                                z = maxZForX;
                            }
                        
                            // Move to a new layer if needed
                            if (bestFitRotation && occupiedLengths[x] + bestFitRotation.length > binDAOS.length) {
                                var shortestDimension = Math.min(bestFitRotation.width, bestFitRotation.length);
                                var totalCanFit = (binDAOS.length - occupiedLengths[previousBox.x]) / shortestDimension;
                        
                                if (Math.floor(totalCanFit) >= 1) {
                                    var rotatedWidth = Math.max(bestFitRotation.width, bestFitRotation.length);
                                    var rotatedLength = Math.min(bestFitRotation.width, bestFitRotation.length);
                        
                                    // Try with width > length
                                    if ((z + rotatedLength) <= binDAOS.length) {
                                        bestFitRotation.width = rotatedWidth;
                                        bestFitRotation.length = rotatedLength;
                                        z -= bestFitRotation.width;
                                        maxZForX -= bestFitRotation.width;
                                    } 
                        
                                    if (z + bestFitRotation.length <= binDAOS.length) {
                                        x = previousBox.x;
                                        maxZForX = occupiedLengths[x];
                                        z += bestFitRotation.length;
                                    } else {
                                        fit = false;
                                    }
                        
                                } else {
                                    z = 0;
                                    y += bestFitRotation.height;
                                    x = 0;
                                    maxZForX = 0;
                                    occupiedLengths = [];
                        
                                    itemsPerLayerDAOS.push(palletsPerLayerDAOS);
                                    palletsPerLayerDAOS = 0;
                                    layerCountDAOS++;
                                }

                            }
                        
                            // If no space in X and Z axis, move to a new layer (increase Y)
                            if (!bestFitRotation && y + maxRowHeight + rotatedBox.height <= binDAOS.height) {

                                var shortestDimension = Math.min(rotatedBox.width, rotatedBox.length);
                                var totalCanFit = (binDAOS.length - occupiedLengths[previousBox.x]) / shortestDimension;

                                if (Math.floor(totalCanFit) >= 1) {

                                    var rotatedWidth = Math.max(rotatedBox.width, rotatedBox.length);
                                    var rotatedLength = Math.min(rotatedBox.width, rotatedBox.length);

                                    if (z + rotatedLength <= binDAOS.length) {
                                        rotatedBox.width = rotatedWidth;
                                        rotatedBox.length = rotatedLength;

                                        z -= rotatedBox.width;

                                        maxZForX -= rotatedBox.width;
                                    } 

                                    if(z + rotatedBox.length <= binDAOS.length){
                                        x = previousBox.x;
                                        maxZForX = occupiedLengths[x];
                                        z += rotatedBox.length;
                                    } else {
                                        fit = false;
                                    }


                                } else {

                                    y += maxRowHeight; 
                                    maxRowHeight = rotatedBox.height;
                                    x = 0;  
                                    z = 0;  
                                }
                                    
                                bestFitRotation = rotatedBox;
                            }
                        
                            // Update available space
                            currentPosition = {
                                remainingLength: binDAOS.length - z,
                                remainingWidth: binDAOS.width - x,
                                remainingHeight: binDAOS.height - y
                            };

                        });

                        var heightMap = {};  
                        if (bestFitRotation) {
                            // Find the max occupied space on the z-axis for the range of x indices
                            for (var xi = x; xi < x + bestFitRotation.width; xi++) {

                                if (occupiedLengths[xi]) {
                                    maxZForX = occupiedLengths[xi];
                                } else {
                                    maxZForX = z;
                                }
                            }

                            var positionKey = x + "," + z;
                            if (!occupiedHeights[positionKey]) {
                                occupiedHeights[positionKey] = 0;
                            }
                        
                            var occupiedHeightAtPosition = occupiedHeights[positionKey];
                            
                            if (y + bestFitRotation.height <= binDAOS.height) {
                                
                                palletsPerLayerDAOS++;

                                // move to a new column
                                if (x + bestFitRotation.width > binDAOS.width) {
                                    x = 0;
                                    maxZForX += bestFitRotation.length;
                                    z = maxZForX;
                                }
                                
                                // move to a new layer
                                if (z + bestFitRotation.length > binDAOS.length) {
                                    var shortestDimension = Math.min(bestFitRotation.width, bestFitRotation.length);
                                    var totalCanFit = (binDAOS.length - occupiedLengths[previousBox.x]) / shortestDimension;

                                    if (Math.floor(totalCanFit) >= 1) {

                                        var rotatedWidth = Math.max(bestFitRotation.width, bestFitRotation.length);
                                        var rotatedLength = Math.min(bestFitRotation.width, bestFitRotation.length);

                                        if (z + rotatedLength <= binDAOS.length) {
                                            bestFitRotation.width = rotatedWidth;
                                            bestFitRotation.length = rotatedLength;

                                            z -= bestFitRotation.width;

                                            maxZForX -= bestFitRotation.width;
                                        } 

                                        if(z + bestFitRotation.length <= binDAOS.length){
                                            x = previousBox.x;
                                            maxZForX = occupiedLengths[x];
                                            z += bestFitRotation.length;
                                        } else {

                                            fit = false;
                                        }

                                    } else {

                                        z = 0;
                                        y += bestFitRotation.height;
                                        x = 0;
                                        maxZForX = 0;
                                        occupiedLengths = [];
                                        
                                        itemsPerLayerDAOS.push(palletsPerLayerDAOS);
                                        palletsPerLayerDAOS = 0;
                                        layerCountDAOS++;
                                    }

                                }

                                if(fit === true){

                                    if (!heightMap[positionKey]) {
                                        heightMap[positionKey] = occupiedHeightAtPosition + bestFitRotation.height;
                                    } else {
                                        heightMap[positionKey] = Math.max(heightMap[positionKey], occupiedHeightAtPosition + bestFitRotation.height);
                                    }
        
                                    var minOccupiedHeight = Math.min.apply(null, Object.values(heightMap)) || 0;
                                    var remainingHeight = binDAOS.height - minOccupiedHeight;
        
                                    totPalletsPerLayer++;
                                    previousBox = {
                                        x: x,
                                        y: y,
                                        z: maxZForX,
                                        width: bestFitRotation.width,
                                        height: bestFitRotation.height,
                                        length: bestFitRotation.length
                                    };

                                    packedBoxesDAOS.push({
                                        x: x,
                                        y: y,
                                        z: maxZForX, 
                                        originalDimensions: box,
                                        box: bestFitRotation,
                                        color: currentItemColor,
                                        remainingDimensions: {
                                            remainingLength: binDAOS.length - (z + bestFitRotation.length),
                                            remainingWidth: binDAOS.width - x,
                                            remainingHeight: remainingHeight
                                        },
                                        type: box.type,
                                        product: box.product,
                                        internalId: box.internalId,
                                        weight: box.weight,
                                        maxWeightTon: box.maxWeightTon,
                                        price: box.price,
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
                                        packsPerContainer: box.packsPerContainer,
                                        remainingHeight: remainingHeight,
                                        minOccupiedHeight: minOccupiedHeight,
                                        recommendedItems: box.recommendedItems
                                    });

                                    if (!totalPriceByProductDAOS[bestFitRotation.product]) {
                                        totalPriceByProductDAOS[bestFitRotation.product] = 0;
                                    }
                                    totalPriceByProductDAOS[bestFitRotation.product] += bestFitRotation.price;
                                    grandTotalDAOS += bestFitRotation.price;
                                    netWeightDAOS += bestFitRotation.weight;
                                    grossWeightDAOS += bestFitRotation.weight;
                                    
                                    // maxZForX += bestFitRotation.length;
                                    for (var xi = x; xi < x + bestFitRotation.width; xi++) {
                                        occupiedLengths[xi] = maxZForX + bestFitRotation.length;
                                    }
        
                                    occupiedHeights[positionKey] = Math.max(occupiedHeightAtPosition, occupiedHeightAtPosition + bestFitRotation.height);
                                }
                                x += bestFitRotation.width;
                                
                            } else {

                                currentBox = box;
                                allContainersDAOS.push({ packedBoxes: packedBoxesDAOS, containerListDAOS: containerListDAOS });
                                
                                x = 0;
                                y = 0;
                                z = 0;
                                maxZForX = 0;
                                heightMap = {};  
                                packedBoxesDAOS = [];
                                occupiedLengths = {};
                                itemsPerLayerDAOS = [];
                                itemsPerLayerDAOS.push(totPalletsPerLayer);
                                totPalletsPerLayer = 1;
                                layerCountDAOS = 0;
                                palletsPerLayerDAOS = 0;
                                itemsPerLayerDAOS = [];
                                
                                
                                if (canFit({ remainingLength: binDAOS.length, remainingWidth: binDAOS.width, remainingHeight: binDAOS.height }, box)) {
                                    packedBoxesDAOS.push({
                                        x: x,
                                        y: y,
                                        z: z,
                                        originalDimensions: box,
                                        box: box,
                                        color: currentItemColor,
                                        remainingDimensions: {
                                            remainingLength: binDAOS.length - box.length,
                                            remainingWidth: binDAOS.width - box.width,
                                            remainingHeight: binDAOS.height - box.height
                                        },
                                        type: box.type,
                                        product: box.product,
                                        internalId: box.internalId,
                                        weight: box.weight,
                                        maxWeightTon: box.maxWeightTon,
                                        layer: layerCountDAOS,
                                        netWeight: box.netWeight,
                                        grossWeight: box.grossWeight, 
                                        noOfPallets: 1, 
                                        palletsPerContainer: 0, 
                                        palletsPerLayer: 1,
                                        productLayer: box.layer,
                                        parent: box.parent,
                                        displayName: box.displayName,
                                        reamsPerContainer: 0,
                                        boxesPerContainer: 0,
                                        packsPerContainer: 0,
                                        recommendedItems: box.recommendedItems
                                    });
                                    
                                    x += box.width;
                                    log.debug('Placed current box in new container:', box);
                                } else {
                                    log.debug('Current box still cannot fit in the new container:', box);
                                }
                            }
                        } else {

                            currentBox = box;
                            allContainersDAOS.push({ packedBoxes: packedBoxesDAOS, containerListDAOS: containerListDAOS });
                            
                            x = 0;
                            y = 0;
                            z = 0;
                            maxZForX = 0;
                            heightMap = {};  
                            packedBoxesDAOS = [];
                            occupiedLengths = {};
                            itemsPerLayerDAOS = [];
                            itemsPerLayerDAOS.push(totPalletsPerLayer);
                            totPalletsPerLayer = 1;
                            layerCountDAOS = 0;
                            palletsPerLayerDAOS = 0;
                            itemsPerLayerDAOS = [];
                            
                            if (canFit({ remainingLength: binDAOS.length, remainingWidth: binDAOS.width, remainingHeight: binDAOS.height }, box)) {
                                packedBoxesDAOS.push({
                                    x: x,
                                    y: y,
                                    z: z,
                                    originalDimensions: box,
                                    box: box,
                                    color: currentItemColor,
                                    remainingDimensions: {
                                        remainingLength: binDAOS.length - box.length,
                                        remainingWidth: binDAOS.width - box.width,
                                        remainingHeight: binDAOS.height - box.height
                                    },
                                    type: box.type,
                                    product: box.product,
                                    internalId: box.internalId,
                                    weight: box.weight,
                                    maxWeightTon: box.maxWeightTon,
                                    layer: layerCountDAOS,
                                    netWeight: box.netWeight,
                                    grossWeight: box.grossWeight, 
                                    noOfPallets: 1, 
                                    palletsPerContainer: 1, 
                                    palletsPerLayer: 1,
                                    productLayer: box.layer,
                                    parent: box.parent,
                                    displayName: box.displayName,
                                    reamsPerContainer: box.reamsPerContainer,
                                    boxesPerContainer: box.boxesPerContainer,
                                    packsPerContainer: box.packsPerContainer,
                                    recommendedItems: box.recommendedItems
                                });
                                
                                x += box.width;
                                log.debug('Placed current box in new container:', box);
                            } else {
                                log.debug('Current box still cannot fit in the new container:', box);
                            }
                        }
                    }
                });
                
                if (packedBoxesDAOS.length > 0) {

                    allContainersDAOS.push(
                    {
                        packedBoxes: packedBoxesDAOS, 
                        containerListDAOS: containerListDAOS
                    });
                    
                }

                if (totPalletsPerLayer > 0) {
                    itemsPerLayerDAOS.push(totPalletsPerLayer);
                }

                if(balanceHeight > 0 || balanceLength > 0 || balanceWidth > 0) 
                {
                    itemRecommendation = true;
                }
            }

            if(hasDACP){
                var x = 0, y = 0, z = 0;
                var currentLayerWidth = 0; 
        
                // Logic for boxes with different weights
                var leftSideWeight = 0;
                var rightSideWeight = 0;
                var boxesThatFitOnX = [];
                var totalWidth = 0;
                var rowNumber = 0; 
                var placeOnLeft = true; 
                var occupiedHeights = [];
                var currentBox = null;

                if (Object.keys(boxesDACP).length > 1){
                    
                    var balanceWidth = binDACP.width;
                    var balanceLength = binDACP.length;
                    var balanceHeight = binDACP.height;
                    var balanceWeight = binDACP.maxWeight;
                
                    Object.keys(boxesDACP).forEach(function (parent) {
                        var items = boxesDACP[parent];
                    
                        // **Sort items by volume (Largest First)**
                        items.sort(function (a, b) {
                            return (b.width * b.length * b.height) - (a.width * a.length * a.height);
                        });
                    
                        // **Initialize variables for tracking the best optimized box**
                        var bestBox = null;
                        var bestOptimizationScore = null;
                    
                        items.forEach(function (box) {
                            if (box.type === 'double a colour paper') {

                                if(box.baseUnitAbbreviation){
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
                                    var palletsPerLayer = Math.floor((binDACP.width * binDACP.length) / (box.width * box.length)) || 1;
                                    var palletsPerContainer = Math.floor(box.weight / (box.netWeightPerPallet / 1000)) || 1;
                                    var palletNetWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                                    var netWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                                    var grossWeight = (box.grossWeightPerPallet / 1000) * palletsPerContainer;

                                    var decimalGrossWeight = palletNetWeight + grossWeight;
                                    var weight = Math.floor(decimalGrossWeight - palletNetWeight);
                                    var layer = palletsPerContainer / palletsPerLayer || 1;
                                    var maxLayers = Math.floor(balanceHeight / box.height);
                                    var noOfPallets = Math.floor(box.weight / (box.netWeightPerPallet / 1000)) || 1;
                                    var noOfContainers = noOfPallets / palletsPerContainer || 1;
                                    var reamsPerContainer = Math.floor(palletsPerContainer * (box.netWeightPerPallet / box.uomConversionRates.ream));
                                    var boxesPerContainer = Math.floor((box.weight * 1000) / box.uomConversionRates.box);
        
                                    // **Step 2: Calculate optimization score**
                                    var areaUtilization = areaOfPallet / areaOfContainer;
                                    var volumeUtilization = volumeOfPallet / volumeOfContainer;
                                    var weightUtilization = grossWeight / (binDACP.maxWeight || 1);
                    
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
                    
                        // **Step 4: Push the selected best box to containerListDACP**
                        if (bestBox) {
                            
                            var palletsPerLayer = Math.floor((binDACP.width * binDACP.length) / (bestBox.width * bestBox.length)) || 1;
                            var palletsPerContainer = Math.floor(bestBox.weight / (bestBox.netWeightPerPallet / 1000)) || 1;
                            var palletNetWeight = (bestBox.netWeightPerPallet / 1000) * palletsPerContainer;
                            var netWeight = (bestBox.netWeightPerPallet / 1000) * palletsPerContainer;
                            var grossWeight = (bestBox.grossWeightPerPallet / 1000) * palletsPerContainer;

                            var decimalGrossWeight = palletNetWeight + grossWeight;
                            var weight = Math.floor(decimalGrossWeight - palletNetWeight);
                            var layer = palletsPerContainer / palletsPerLayer || 1;
                            var maxLayers = binDACP.height / bestBox.height;
                            var noOfPallets = Math.floor(bestBox.weight / (bestBox.netWeightPerPallet / 1000)) || 1;
                            var noOfContainers = noOfPallets / palletsPerContainer || 1;
                            var reamsPerContainer = Math.floor(palletsPerContainer * (bestBox.netWeightPerPallet / bestBox.uomConversionRates.ream));
                            var boxesPerContainer = Math.floor((bestBox.weight * 1000) / bestBox.uomConversionRates.box);
                            
                            if(palletsPerLayer > palletsPerContainer){
                                palletsPerLayer = palletsPerContainer;
                            }

                            containerListDACP.push({
                                parent: parent,
                                type: bestBox.type,
                                product: bestBox.product,
                                internalId: bestBox.internalId,
                                displayName: bestBox.displayName,
                                weight: bestBox.weight,
                                maxWeightTon: bestBox.maxWeightTon,
                                layer: layer,
                                netWeight: netWeight,
                                grossWeight: grossWeight,
                                reamsPerContainer: reamsPerContainer,
                                boxesPerContainer: boxesPerContainer,
                                noOfPallets: noOfPallets,
                                palletsPerContainer: palletsPerContainer,
                                palletsPerLayer: palletsPerLayer,
                                productLayer: bestBox.layer
                            });

                            // **Step 5: Store Data for This Item in `boxesDACP3D`**
                            for (var i = 0; i < noOfPallets; i++) {
                                boxesDACP3D.push({
                                    parent: parent,
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
                                    maxWeightTon: bestBox.maxWeightTon,
                                    netWeightPerPallet: bestBox.netWeightPerPallet,
                                    grossWeightPerPallet: bestBox.grossWeightPerPallet,
                                    reamsPerContainer: reamsPerContainer,
                                    boxesPerContainer: boxesPerContainer,
                                    netWeight: netWeight,
                                    grossWeight: grossWeight,
                                    palletsPerContainer: palletsPerContainer,
                                    palletsPerLayer: palletsPerLayer,
                                    maxLayers: maxLayers,
                                    noOfPallets: noOfPallets,
                                    noOfContainers: noOfContainers
                                });
                            }


                            // **Step 5: Update Remaining Space**
                            balanceWidth -= bestBox.width;   // Reduce available width
                            balanceLength -= bestBox.length; // Reduce available length
                            balanceHeight -= bestBox.height; // Reduce available height
                            balanceWeight -= bestBox.weight; // Reduce weight capacity
                
                            // Remove selected box from items list
                            items.splice(bestBox, 1);

                        }
                    });
                    
                } else {
                    Object.keys(boxesDACP).forEach(function (parent) {
                        var items = boxesDACP[parent];
                    
                        // Sort items by volume (Largest First)
                        items.sort(function (a, b) {
                            return (b.width * b.length * b.height) - (a.width * a.length * a.height);
                        });
                    
                        var totalNetWeightPerPallet = 0;
                        items.forEach(function (box) {
                            if (box.type === 'double a colour paper') {
                                totalNetWeightPerPallet += box.netWeightPerPallet;
                            }
                        });
                    
                        items.forEach(function (box) {
                            if (box.type === 'double a colour paper') {

                                if(box.baseUnitAbbreviation){
                                    var baseUnit = box.baseUnitAbbreviation.toLowerCase();
                                    box.weight = (box.weight * box.uomConversionRates[baseUnit]) / box.uomConversionRates.ton;
                                    box.maxWeightTon = box.weight;
                                }

                                var totalWeight = 0;
                                var palletsPerContainer = Math.floor((box.weight * 1000) / totalNetWeightPerPallet);
                                var noOfPallets = Math.floor((box.weight * 1000) / totalNetWeightPerPallet);
                                var palletsPerLayer = Math.floor((binDACP.width * binDACP.length) / (box.width * box.length)) || 1;
                                var palletNetWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                                var grossWeight = (box.grossWeightPerPallet / 1000) * palletsPerContainer;
                                var netWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                                var maxLayers = Math.floor(binDACP.height / box.height);
                                var noOfContainers = noOfPallets / palletsPerContainer || 1;
                                var decimalGrossWeight = palletNetWeight + grossWeight;
                                var weight = Math.floor(decimalGrossWeight - palletNetWeight);
                                var reamsPerContainer = Math.floor(palletsPerContainer * (box.netWeightPerPallet / box.uomConversionRates.ream));
                                var boxesPerContainer = Math.floor((weight * 1000) / box.uomConversionRates.box);

                    
                                // Calculate the total weight of all items
                                totalWeight += box.weight;
                                var recommendedWeight = Math.max(0, box.maxWeightTon - totalWeight);
                    
                                if (palletsPerLayer > palletsPerContainer) {
                                    palletsPerLayer = palletsPerContainer;
                                }
                    
                                // List recommended items if recommendedWeight > 0
                                var recommendedItems = {};

                                if (recommendedWeight > 0) {
                                    box.itemRecommendation.forEach(function (item) {
                                        var maxQuantity = Math.floor((recommendedWeight * 1000) / item.netWeightperPallet);
                                        var maxLayers = Math.floor(binDACP.height / item.height);
                                        var layerKey = item.layer; // Use the item's layer as the key

                                        if (maxQuantity > 0 && maxLayers > 0) {
                                            if (!recommendedItems[layerKey]) {
                                                recommendedItems[layerKey] = {
                                                    layer: layerKey,
                                                    maxQuantity: maxQuantity,
                                                    maxLayers: maxLayers,
                                                    length: item.length,
                                                    width: item.width,
                                                    height: item.height,
                                                };
                                            }
                                        }
                                    });

                                    // Convert object to array
                                    recommendedItems = Object.values(recommendedItems);
                                }
                                
                                var sortedRecommendedItems = null;
                                if(box.itemRecommendation){

                                    var sortedRecommendedItems = box.itemRecommendation.sort(function (a, b) {
                                        var aPriority = a.name.toLowerCase().includes("double a") ? 1 : 0;
                                        var bPriority = b.name.toLowerCase().includes("double a") ? 1 : 0;
                                    
                                        if (bPriority !== aPriority) {
                                            return bPriority - aPriority; // Prioritize Double A items first
                                        }
                                        return (b.length * b.width * b.height) - (a.length * a.width * a.height); // Sort by best fit
                                    });
                                    
                                    // Keep only the top 3-5 tightest fitting recommendations
                                    sortedRecommendedItems = sortedRecommendedItems.slice(0, 5);
                                    
                                }

                                // Push all items to containerListDACP
                                containerListDACP.push({
                                    parent: parent,
                                    type: box.type,
                                    product: box.product,
                                    internalId: box.internalId,
                                    displayName: box.displayName,
                                    weight: box.weight,
                                    maxWeightTon: box.maxWeightTon,
                                    grossWeight: grossWeight,
                                    netWeight: netWeight,
                                    reamsPerContainer: reamsPerContainer,
                                    noOfPallets: palletsPerContainer,
                                    palletsPerContainer: palletsPerContainer,
                                    palletsPerLayer: palletsPerLayer,
                                    productLayer: box.layer,
                                    boxesPerContainer: boxesPerContainer,
                                    recommendedItems: recommendedItems,
                                    sortedRecommendedItems: sortedRecommendedItems
                                });
                    
                                // Store all items in boxesDACP3D
                                // for (var i = 0; i < palletsPerContainer; i++) {
                                    boxesDACP3D.push({
                                        parent: parent,
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
                                        maxWeightTon: box.maxWeightTon,
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
                                // }
                            }
                        });
                    });
                    
                }
                
                var remainingBoxes = null;
                var colorMap = {};
                var totPalletsPerLayer = 0;
                boxesDACP3D.forEach(function (box, boxIndex) {

                    if(box.type == 'double a colour paper'){

                        // 3D Start
                        // var currentLayerColor = colors[layerCountDACP % colors.length]; 

                        // Assign a unique color per item
                        if (!colorMap[box.product]) {
                            colorMap[box.product] = colors[Object.keys(colorMap).length % colors.length];
                        }
                        var currentItemColor = colorMap[box.product]; // Get the color for the current item

                        var rotations = generateLogicalRotations(box); 
                        var bestFitRotation = null;
                        var bestFitWithShorterWidth = null;
                        var bestFitWithLongerWidth = null;
                        var positionKey = x + ',' + z; // Create the key as 'x,z'
                        var occupiedHeightAtPosition = occupiedHeights[positionKey] || 0; // Get the occupied height at (x, z), or 0 if none
                        // Set the initial benchmark using the first box rotation
                        var firstRotation = rotations[0];
                        var initialRemainingDimensions = {
                            remainingLength: binDACP.length - z,
                            remainingWidth: binDACP.width - x,
                            remainingHeight: binDACP.height - y
                        };
            
                        var initialRemainingVolume = initialRemainingDimensions.remainingLength * initialRemainingDimensions.remainingWidth * initialRemainingDimensions.remainingHeight;
            
                        // Initialize the best fit with the first rotation
                        if (canFit(initialRemainingDimensions, firstRotation)) {
                            bestFitRotation = firstRotation; // Set the first rotation as the initial best fit
                        }

                        // Define current position for each box before checking its fit
                        var currentPosition = {
                            remainingLength: binDACP.length - z,
                            remainingWidth: binDACP.width - totalWidth,  
                            remainingHeight: binDACP.height - y
                        };
                    
                        // Variables to hold the best fits
                        var bestFitWithShorterWidth = null;
                        var bestFitWithLongerWidth = null;
                    
                        // Check each box rotation for fit
                        rotations.forEach(function(rotatedBox) {
                            // Check if the current rotation can fit
                            if (canFit(currentPosition, rotatedBox)) {
                            
                                remainingBoxes = boxesDACP3D.slice(boxIndex + 1);
                                var isLastBox = remainingBoxes.length === 0;

                                // Prioritize boxes with LONGER WIDTH than LENGTH
                                if (rotatedBox.width > rotatedBox.length && totalWidth + rotatedBox.width <= binDACP.width) {
                                    if (!bestFitWithLongerWidth || rotatedBox.weight < bestFitWithLongerWidth.weight) {
                                        bestFitWithLongerWidth = rotatedBox;
                                    }
                                } 
                                // Otherwise, consider using a shorter width for the last box scenario
                                else if (totalWidth + rotatedBox.length <= binDACP.width) {
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
                    
                        if(boxesThatFitOnX.length > 0){
                            bestFitRotation = boxesThatFitOnX[0];
                        }

                        // Distribute boxes along the x-axis row by alternating placement between front and back sides
                        boxesThatFitOnX.forEach(function(fittedBox, index) {
                            // Determine if we are on an even or odd row (rowNumber tracks rows)
                            var isEvenRow = rowNumber % 2 === 0; // Even rows start from front (left), odd rows from back (right)
                    
                            // Alternate between front and back placement
                            var placeOnFront = (isEvenRow && placeOnLeft) || (!isEvenRow && !placeOnLeft);
                            var sideToPlace = placeOnFront ? 'left' : 'right';
                    
                            // Place the box based on whether it's on the left (front) or right (back)
                            var xOffset = sideToPlace === 'left' ? totalWidth : binDACP.width - (totalWidth + fittedBox.width);
                    
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
                        
                            if (occupiedHeightAtPosition + bestFitRotation.height <= binDACP.height) {
                                palletsPerLayerDACP++;
                        
                                if (!heightMap[positionKey]) {
                                    heightMap[positionKey] = occupiedHeightAtPosition + bestFitRotation.height;
                                } else {
                                    heightMap[positionKey] = Math.max(heightMap[positionKey], occupiedHeightAtPosition + bestFitRotation.height);
                                }
                        
                                var minOccupiedHeight = Math.min.apply(null, Object.values(heightMap)) || 0;
                                var remainingHeight = binDACP.height - minOccupiedHeight;
                        
                                totPalletsPerLayer++;
                        
                                packedBoxesDACP.push({
                                    x: x,
                                    y: occupiedHeightAtPosition,
                                    z: z,
                                    originalDimensions: box,
                                    box: bestFitRotation,
                                    color: currentItemColor,
                                    remainingDimensions: {
                                        remainingLength: binDACP.length - z,
                                        remainingWidth: binDACP.width - x,
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
                                
                                grandTotalDACP += bestFitRotation.price;
                                x += bestFitRotation.width;
                        
                                if (x + bestFitRotation.width > binDACP.width) {
                                    x = 0;
                                    z += bestFitRotation.length;
                                }
                        
                                var layers = parseInt(bestFitRotation.layer.slice(0, -1));

                                if (z + bestFitRotation.length > binDACP.length) {
                                    if (layerCountDACP + 1 < layers) {
                                        z = 0;
                                        y += bestFitRotation.height;
                                        itemsPerLayerDACP.push(totPalletsPerLayer);
                                        totPalletsPerLayer = 0;
                                        palletsPerLayerDACP = 0;
                                        layerCountDACP++;
                                    }
                                }

                        
                                occupiedHeights[positionKey] = Math.max(occupiedHeightAtPosition, occupiedHeightAtPosition + bestFitRotation.height);
                            }
                        
                        } else {
                            log.debug('No valid box to fit:', box);
                            currentBox = box;
                        
                            allContainersDACP.push({ packedBoxes: packedBoxesDACP, containerListDACP: containerListDACP });
                        
                            x = 0;
                            y = 0;
                            z = 0;
                            packedBoxesDACP = [];
                            occupiedHeights = {};
                            heightMap = {};
                            layerCountDACP = 0;
                            palletsPerLayerDACP = 0;
                            itemsPerLayerDACP = [];
                            itemsPerLayerDACP.push(totPalletsPerLayer);
                            totPalletsPerLayer = 1;
                        
                            if (box.width < box.length) {
                                var temp = box.width;
                                box.width = box.length;
                                box.length = temp;
                            }
                        
                            if (canFit({ remainingLength: binDACP.length, remainingWidth: binDACP.width, remainingHeight: binDACP.height }, box)) {
                                packedBoxesDACP.push({
                                    x: x,
                                    y: y,
                                    z: z,
                                    originalDimensions: box,
                                    box: box,
                                    color: currentItemColor,
                                    remainingDimensions: {
                                        remainingLength: binDACP.length - box.length,
                                        remainingWidth: binDACP.width - box.width,
                                        remainingHeight: binDACP.height - box.height
                                    },
                                    type: box.type,
                                    product: box.product,
                                    internalId: box.internalId,
                                    weight: box.weight,
                                    layer: layerCountDACP,
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
                                log.debug('Placed current box in new container:', box);
                            } else {
                                log.debug('Current box still cannot fit in the new container:', box);
                            }
                        }
                        

                    }

                });
                
                if (packedBoxesDACP.length > 0) {
                    allContainersDACP.push(
                        {
                            packedBoxes: packedBoxesDACP, 
                            containerListDACP: containerListDACP
                        });
                }

                if (totPalletsPerLayer > 0) {
                    itemsPerLayerDACP.push(totPalletsPerLayer);
                }
                
                if(balanceHeight > 0 || balanceLength > 0 || balanceWidth > 0) 
                {
                    itemRecommendation = true;
                }
            }

            if (hasCMSheet) {
                var x = 0, y = 0, z = 0; 
                var currentLayerWidth = 0;
                var leftSideWeight = 0;
                var rightSideWeight = 0;
                var boxesThatFitOnX = [];
                var totalWidth = 0;
                var rowNumber = 0;
                var placeOnLeft = true;
                var occupiedHeights = []; 
                var isFirstBox = true;
                var newZ = 0;
                var totalMaxX = 0;
            
                // Get the maximum z value for a given x position
                function getMaxZForX(x, smallestBoxWidth, currentPosition) {
                    var maxZ = 0; 
                    var totalMaxX = 0;
                
                    for (var i = 0; i < packedBoxesCMSheet.length; i++) {
                        var placedBox = packedBoxesCMSheet[i];
                        var previousPlacedBox = packedBoxesCMSheet[i - 1];
                
                        if (placedBox.x === 0) {
                            totalMaxX = placedBox.box.width;
                        } else {
                            totalMaxX += placedBox.box.width;
                        }
                
                        // **Condition 1: Placed at start (X = 0)**
                        if (x === 0 && placedBox.x === 0) {
                            maxZ = Math.max(maxZ, placedBox.z + placedBox.box.length);
                        
                        // **Condition 2: Box placed after another in X direction**
                        } else if (placedBox.x > 0 && placedBox.z === 0) {
                            maxZ = Math.max(maxZ, placedBox.z + placedBox.box.length);
                
                        // **Condition 3: Handling bin width limits and different box sizes**
                        } else if (placedBox.x > 0 && (totalMaxX + smallestBoxWidth > binCMSheet.width || 
                                (previousPlacedBox && previousPlacedBox.box.length > placedBox.box.length))) {
                            if (previousPlacedBox && previousPlacedBox.box.length > placedBox.box.length &&
                                totalMaxX + smallestBoxWidth > binCMSheet.width) {
                                maxZ = Math.max(maxZ, placedBox.z + previousPlacedBox.box.length);
                            } else {
                                maxZ = Math.max(maxZ, placedBox.z + placedBox.box.length);
                            }
                        }
                    }
                    return maxZ;
                }            
            
                var allBoxes = Object.values(boxesCMSheet).flat();

                var minWeight = Math.min.apply(null, allBoxes.map(function (box) {
                    return box.weight;
                }));

                var maxWeight = Math.max.apply(null, allBoxes.map(function (box) {
                    return box.weight;
                }));

                var smallestBoxWidth = Math.min.apply(null, allBoxes.map(function (box) {
                    return box.width;
                }));

                Object.keys(boxesCMSheet).forEach(function (parent) {
                    var items = boxesCMSheet[parent];

                    // Sort items by volume (Largest First)
                    items.sort(function (a, b) {
                        return (b.width * b.length * b.height) - (a.width * a.length * a.height);
                    });

                    var totalNetWeightPerPallet = 0;
                    items.forEach(function (box) {
                        if (box.type === 'CM Sheet') {
                            totalNetWeightPerPallet += box.netWeightPerPallet;
                        }
                    });

                    items.forEach(function (box) {
                        if (box.type === 'CM Sheet') {
                            
                            if(box.baseUnitAbbreviation){
                                var baseUnit = box.baseUnitAbbreviation.toLowerCase();
                                box.weight = (box.weight * box.uomConversionRates[baseUnit]) / box.uomConversionRates.ton;
                                box.maxWeightTon = box.weight;
                            }

                            var totalWeight = 0;
                            var palletsPerLayer = Math.floor((binCMSheet.width * binCMSheet.length) / (box.width * box.length)) || 1;
                            var palletsPerContainer = Math.floor(box.weight / (box.netWeightPerPallet / 1000)) || 1;
                            var noOfPallets = Math.floor((box.weight * 1000) / totalNetWeightPerPallet);
                            var palletNetWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                            var grossWeight = (box.grossWeightPerPallet / 1000) * palletsPerContainer;
                            var netWeight = (box.netWeightPerPallet / 1000) * palletsPerContainer;
                            var maxLayers = Math.floor(binCMSheet.height / box.height);
                            var noOfContainers = noOfPallets / palletsPerContainer || 1;

                            var decimalGrossWeight = palletNetWeight + grossWeight;
                            var weight = Math.floor(decimalGrossWeight - palletNetWeight);
                            var reamsPerContainer = Math.floor((weight * 1000) / box.uomConversionRates.ream);
                            var boxesPerContainer = Math.floor((weight * 1000) / box.uomConversionRates.box);
                            var packsPerContainer = Math.floor((weight * 1000) / box.uomConversionRates.pack);

                            if(palletsPerLayer > palletsPerContainer){
                                palletsPerLayer = palletsPerContainer;
                            }

                            // Calculate the total weight of all items
                            totalWeight += box.weight;
                            var recommendedWeight = Math.max(0, box.maxWeightTon - totalWeight);
                
                            if (palletsPerLayer > palletsPerContainer) {
                                palletsPerLayer = palletsPerContainer;
                            }
                
                            // List recommended items if recommendedWeight > 0
                            var recommendedItems = [];
                            if (recommendedWeight > 0) {
                                box.itemRecommendation.forEach(function (item) {
                                    var maxQuantity = Math.floor((recommendedWeight * 1000) / item.netWeightperPallet);
                                    var maxLayers = Math.floor(binCMSheet.height / item.height);
                
                                    if (maxQuantity > 0) {
                                        recommendedItems.push({
                                            name: item.name,
                                            maxQuantity: maxQuantity,
                                            maxLayers: maxLayers,
                                            length: item.length,
                                            width: item.width,
                                            height: item.height,
                                            netWeightperPallet: item.netWeightperPallet,
                                            isPriority: item.name.toLowerCase().includes("double a") ? 1 : 0 // Prioritize Double A brand
                                        });
                                    }
                                });

                                // Sort recommendations by priority first, then by best fit (tightest space)
                                recommendedItems.sort(function (a, b) {
                                    if (b.isPriority !== a.isPriority) {
                                        return b.isPriority - a.isPriority;
                                    }
                                    return (b.length * b.width * b.height) - (a.length * a.width * a.height); 
                                });

                                // Keep only the top 3-5 tightest fitting recommendations
                                recommendedItems = recommendedItems.slice(0, 5);
                            }

                            containerListCMSheet.push({
                                parent: parent,
                                type: box.type,
                                product: box.product,
                                internalId: box.internalId,
                                displayName: box.displayName,
                                weight: box.weight,
                                maxWeightTon: box.maxWeightTon,
                                grossWeight: grossWeight,
                                netWeight: netWeight,
                                reamsPerContainer: reamsPerContainer,
                                noOfPallets: palletsPerContainer,
                                palletsPerContainer: palletsPerContainer,
                                palletsPerLayer: palletsPerLayer,
                                productLayer: box.layer,
                                boxesPerContainer: boxesPerContainer,
                                packsPerContainer: packsPerContainer,
                                recommendedItems: recommendedItems
                            });

                            for (var i = 0; i < palletsPerContainer; i++) {

                                boxesCMSheet3D.push({
                                    parent: parent,
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
                                    maxWeightTon: box.maxWeightTon,
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
                                    packsPerContainer: packsPerContainer,
                                    recommendedItems: recommendedItems
                                });
                            }
                        }
                    });
                });
                
                var remainingBoxes = null;
                var colorMap = {};
                var occupiedLengths  = [];
                var maxZForX = 0;
                var totPalletsPerLayer = 0;
                var previousBox = null;
                var fit = true;

                boxesCMSheet3D.forEach(function (box, boxIndex) {
            
                    if (box.type === 'CM Sheet') {
                        if (!colorMap[box.product]) {
                            colorMap[box.product] = colors[Object.keys(colorMap).length % colors.length];
                        }
                        var currentItemColor = colorMap[box.product]; 

                        var rotations = generateLogicalRotations(box);
                        var bestFitRotation = null;
                    
                        // Set up to track the max z for the current x position
                        var positionKey = x + ',' + z; // Create the key as 'x,z'
                        var occupiedHeightAtPosition = occupiedHeights[positionKey] || 0;
                    
                        // Set the initial benchmark using the first box rotation 
                        var firstRotation = rotations[0];
                        var initialRemainingDimensions = {
                            remainingLength: binCMSheet.length - z,
                            remainingWidth: binCMSheet.width - x,
                            remainingHeight: binCMSheet.height - y
                        };
                        
                        var initialRemainingVolume = initialRemainingDimensions.remainingLength * 
                                                    initialRemainingDimensions.remainingWidth * 
                                                    initialRemainingDimensions.remainingHeight;
                        
                        var bestFitRotation = null;
                        if (canFit(initialRemainingDimensions, rotations[0])) {
                            bestFitRotation = rotations[0]; 
                        }
                        
                        // Define the current position before checking fits
                        var currentPosition = {
                            remainingLength: binCMSheet.length - z,
                            remainingWidth: binCMSheet.width - x,  
                            remainingHeight: binCMSheet.height - y
                        };
                        
                        var maxRowHeight = 0;
                        
                        // Find the smallest width and length among all boxes
                        var minBoxWidth = Infinity;
                        var minBoxLength = Infinity;

                        for (var i = 0; i < rotations.length; i++) {
                            if (rotations[i].width < minBoxWidth) {
                                minBoxWidth = rotations[i].width;
                            }
                            if (rotations[i].length < minBoxLength) {
                                minBoxLength = rotations[i].length;
                            }
                        }

                        rotations.forEach(function (rotatedBox) {
                            var remainingWidth = binCMSheet.width - x;
                            var remainingLength = binCMSheet.length - z;
                            var remainingHeight = binCMSheet.height - y;

                            // Check if this is the last box in the row
                            var isLastBoxInRow = remainingWidth <= (minBoxWidth + rotatedBox.width);

                            // Prioritize placing the last box with X > Z if possible
                            if (isLastBoxInRow) {
                                if (rotatedBox.width > rotatedBox.length && x + rotatedBox.width <= binCMSheet.width) {
                                    bestFitRotation = rotatedBox;
                                } 
                                else if (rotatedBox.length > rotatedBox.width && z + rotatedBox.length <= binCMSheet.length) {
                                    bestFitRotation = rotatedBox;
                                }
                            }

                            // Move to a new column if needed
                            if (bestFitRotation && x + bestFitRotation.width > binCMSheet.width) {
                                x = 0;
                                maxZForX += bestFitRotation.length;
                                z = maxZForX;
                            }
                        
                            // Move to a new layer if needed
                            if (bestFitRotation && occupiedLengths[x] + bestFitRotation.length > binCMSheet.length) {
                                var shortestDimension = Math.min(bestFitRotation.width, bestFitRotation.length);
                                var totalCanFit = (binCMSheet.length - occupiedLengths[previousBox.x]) / shortestDimension;
                        
                                if (Math.floor(totalCanFit) >= 1) {
                                    var rotatedWidth = Math.max(bestFitRotation.width, bestFitRotation.length);
                                    var rotatedLength = Math.min(bestFitRotation.width, bestFitRotation.length);
                        
                                    // Try with width > length
                                    if ((z + rotatedLength) <= binCMSheet.length) {
                                        bestFitRotation.width = rotatedWidth;
                                        bestFitRotation.length = rotatedLength;
                                        z -= bestFitRotation.width;
                                        maxZForX -= bestFitRotation.width;
                                    } 
                        
                                    if (z + bestFitRotation.length <= binCMSheet.length) {
                                        x = previousBox.x;
                                        maxZForX = occupiedLengths[x];
                                        z += bestFitRotation.length;
                                    } else {
                                        fit = false;
                                    }
                        
                                } else {
                                    z = 0;
                                    y += bestFitRotation.height;
                                    x = 0;
                                    maxZForX = 0;
                                    occupiedLengths = [];
                        
                                    itemsPerLayerCMSheet.push(palletsPerLayerCMSheet);
                                    palletsPerLayerCMSheet = 0;
                                    layerCountCMSheet++;
                                }

                            }
                        
                            // If no space in X and Z axis, move to a new layer (increase Y)
                            if (!bestFitRotation && y + maxRowHeight + rotatedBox.height <= binCMSheet.height) {

                                var shortestDimension = Math.min(rotatedBox.width, rotatedBox.length);
                                var totalCanFit = (binCMSheet.length - occupiedLengths[previousBox.x]) / shortestDimension;

                                if (Math.floor(totalCanFit) >= 1) {

                                    var rotatedWidth = Math.max(rotatedBox.width, rotatedBox.length);
                                    var rotatedLength = Math.min(rotatedBox.width, rotatedBox.length);

                                    if (z + rotatedLength <= binCMSheet.length) {
                                        rotatedBox.width = rotatedWidth;
                                        rotatedBox.length = rotatedLength;

                                        z -= rotatedBox.width;

                                        maxZForX -= rotatedBox.width;
                                    } 

                                    if(z + rotatedBox.length <= binCMSheet.length){
                                        x = previousBox.x;
                                        maxZForX = occupiedLengths[x];
                                        z += rotatedBox.length;
                                    } else {
                                        fit = false;
                                    }


                                } else {

                                    y += maxRowHeight; 
                                    maxRowHeight = rotatedBox.height;
                                    x = 0;  
                                    z = 0;  
                                }
                                    
                                bestFitRotation = rotatedBox;
                            }
                        
                            // Update available space
                            currentPosition = {
                                remainingLength: binCMSheet.length - z,
                                remainingWidth: binCMSheet.width - x,
                                remainingHeight: binCMSheet.height - y
                            };

                        });

                        var heightMap = {};  
                        if (bestFitRotation) {
                            // Find the max occupied space on the z-axis for the range of x indices
                            for (var xi = x; xi < x + bestFitRotation.width; xi++) {

                                if (occupiedLengths[xi]) {
                                    maxZForX = occupiedLengths[xi];
                                } else {
                                    maxZForX = z;
                                }
                            }

                            var positionKey = x + "," + z;
                            if (!occupiedHeights[positionKey]) {
                                occupiedHeights[positionKey] = 0;
                            }
                        
                            var occupiedHeightAtPosition = occupiedHeights[positionKey];
                            
                            if (y + bestFitRotation.height <= binCMSheet.height) {
                                
                                palletsPerLayerCMSheet++;

                                // move to a new column
                                if (x + bestFitRotation.width > binCMSheet.width) {
                                    x = 0;
                                    maxZForX += bestFitRotation.length;
                                    z = maxZForX;
                                }
                                
                                // move to a new layer
                                if (z + bestFitRotation.length > binCMSheet.length) {
                                    var shortestDimension = Math.min(bestFitRotation.width, bestFitRotation.length);
                                    var totalCanFit = (binCMSheet.length - occupiedLengths[previousBox.x]) / shortestDimension;

                                    if (Math.floor(totalCanFit) >= 1) {

                                        var rotatedWidth = Math.max(bestFitRotation.width, bestFitRotation.length);
                                        var rotatedLength = Math.min(bestFitRotation.width, bestFitRotation.length);

                                        if (z + rotatedLength <= binCMSheet.length) {
                                            bestFitRotation.width = rotatedWidth;
                                            bestFitRotation.length = rotatedLength;

                                            z -= bestFitRotation.width;

                                            maxZForX -= bestFitRotation.width;
                                        } 

                                        if(z + bestFitRotation.length <= binCMSheet.length){
                                            x = previousBox.x;
                                            maxZForX = occupiedLengths[x];
                                            z += bestFitRotation.length;
                                        } else {

                                            fit = false;
                                        }

                                    } else {

                                        z = 0;
                                        y += bestFitRotation.height;
                                        x = 0;
                                        maxZForX = 0;
                                        occupiedLengths = [];
                                        
                                        itemsPerLayerCMSheet.push(palletsPerLayerCMSheet);
                                        palletsPerLayerCMSheet = 0;
                                        layerCountCMSheet++;
                                    }

                                }

                                if(fit === true){

                                    if (!heightMap[positionKey]) {
                                        heightMap[positionKey] = occupiedHeightAtPosition + bestFitRotation.height;
                                    } else {
                                        heightMap[positionKey] = Math.max(heightMap[positionKey], occupiedHeightAtPosition + bestFitRotation.height);
                                    }
        
                                    var minOccupiedHeight = Math.min.apply(null, Object.values(heightMap)) || 0;
                                    var remainingHeight = binCMSheet.height - minOccupiedHeight;
        
                                    totPalletsPerLayer++;
                                    previousBox = {
                                        x: x,
                                        y: y,
                                        z: maxZForX,
                                        width: bestFitRotation.width,
                                        height: bestFitRotation.height,
                                        length: bestFitRotation.length
                                    };

                                    packedBoxesCMSheet.push({
                                        x: x,
                                        y: y,
                                        z: maxZForX, 
                                        originalDimensions: box,
                                        box: bestFitRotation,
                                        color: currentItemColor,
                                        remainingDimensions: {
                                            remainingLength: binCMSheet.length - (z + bestFitRotation.length),
                                            remainingWidth: binCMSheet.width - x,
                                            remainingHeight: remainingHeight
                                        },
                                        type: box.type,
                                        product: box.product,
                                        internalId: box.internalId,
                                        weight: box.weight,
                                        maxWeightTon: box.maxWeightTon,
                                        price: box.price,
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
                                        packsPerContainer: box.packsPerContainer,
                                        remainingHeight: remainingHeight,
                                        minOccupiedHeight: minOccupiedHeight,
                                        recommendedItems: box.recommendedItems
                                    });

                                    if (!totalPriceByProductCMSheet[bestFitRotation.product]) {
                                        totalPriceByProductCMSheet[bestFitRotation.product] = 0;
                                    }
                                    totalPriceByProductCMSheet[bestFitRotation.product] += bestFitRotation.price;
                                    grandTotalCMSheet += bestFitRotation.price;
                                    netWeightCMSheet += bestFitRotation.weight;
                                    grossWeightCMSheet += bestFitRotation.weight;
                                    
                                    // maxZForX += bestFitRotation.length;
                                    for (var xi = x; xi < x + bestFitRotation.width; xi++) {
                                        occupiedLengths[xi] = maxZForX + bestFitRotation.length;
                                    }
        
                                    occupiedHeights[positionKey] = Math.max(occupiedHeightAtPosition, occupiedHeightAtPosition + bestFitRotation.height);
                                }
                                x += bestFitRotation.width;
                                
                            } else {

                                currentBox = box;
                                allContainersCMSheet.push({ packedBoxes: packedBoxesCMSheet, containerListCMSheet: containerListCMSheet });
                                
                                x = 0;
                                y = 0;
                                z = 0;
                                maxZForX = 0;
                                heightMap = {};  
                                packedBoxesCMSheet = [];
                                occupiedLengths = {};
                                itemsPerLayerCMSheet = [];
                                itemsPerLayerCMSheet.push(totPalletsPerLayer);
                                totPalletsPerLayer = 1;
                                layerCountCMSheet = 0;
                                palletsPerLayerCMSheet = 0;
                                itemsPerLayerCMSheet = [];
                                
                                
                                if (canFit({ remainingLength: binCMSheet.length, remainingWidth: binCMSheet.width, remainingHeight: binCMSheet.height }, box)) {
                                    packedBoxesCMSheet.push({
                                        x: x,
                                        y: y,
                                        z: z,
                                        originalDimensions: box,
                                        box: box,
                                        color: currentItemColor,
                                        remainingDimensions: {
                                            remainingLength: binCMSheet.length - box.length,
                                            remainingWidth: binCMSheet.width - box.width,
                                            remainingHeight: binCMSheet.height - box.height
                                        },
                                        type: box.type,
                                        product: box.product,
                                        internalId: box.internalId,
                                        weight: box.weight,
                                        maxWeightTon: box.maxWeightTon,
                                        layer: layerCountCMSheet,
                                        netWeight: box.netWeight,
                                        grossWeight: box.grossWeight, 
                                        noOfPallets: 1, 
                                        palletsPerContainer: 0, 
                                        palletsPerLayer: 1,
                                        productLayer: box.layer,
                                        parent: box.parent,
                                        displayName: box.displayName,
                                        reamsPerContainer: 0,
                                        boxesPerContainer: 0,
                                        packsPerContainer: 0,
                                        recommendedItems: box.recommendedItems
                                    });
                                    
                                    x += box.width;
                                    log.debug('Placed current box in new container:', box);
                                } else {
                                    log.debug('Current box still cannot fit in the new container:', box);
                                }
                            }
                        } else {

                            currentBox = box;
                            allContainersCMSheet.push({ packedBoxes: packedBoxesCMSheet, containerListCMSheet: containerListCMSheet });
                            
                            x = 0;
                            y = 0;
                            z = 0;
                            maxZForX = 0;
                            heightMap = {};  
                            packedBoxesCMSheet = [];
                            occupiedLengths = {};
                            itemsPerLayerCMSheet = [];
                            itemsPerLayerCMSheet.push(totPalletsPerLayer);
                            totPalletsPerLayer = 1;
                            layerCountCMSheet = 0;
                            palletsPerLayerCMSheet = 0;
                            itemsPerLayerCMSheet = [];
                            
                            if (canFit({ remainingLength: binCMSheet.length, remainingWidth: binCMSheet.width, remainingHeight: binCMSheet.height }, box)) {
                                packedBoxesCMSheet.push({
                                    x: x,
                                    y: y,
                                    z: z,
                                    originalDimensions: box,
                                    box: box,
                                    color: currentItemColor,
                                    remainingDimensions: {
                                        remainingLength: binCMSheet.length - box.length,
                                        remainingWidth: binCMSheet.width - box.width,
                                        remainingHeight: binCMSheet.height - box.height
                                    },
                                    type: box.type,
                                    product: box.product,
                                    internalId: box.internalId,
                                    weight: box.weight,
                                    maxWeightTon: box.maxWeightTon,
                                    layer: layerCountCMSheet,
                                    netWeight: box.netWeight,
                                    grossWeight: box.grossWeight, 
                                    noOfPallets: 1, 
                                    palletsPerContainer: 1, 
                                    palletsPerLayer: 1,
                                    productLayer: box.layer,
                                    parent: box.parent,
                                    displayName: box.displayName,
                                    reamsPerContainer: box.reamsPerContainer,
                                    boxesPerContainer: box.boxesPerContainer,
                                    packsPerContainer: box.packsPerContainer,
                                    recommendedItems: box.recommendedItems
                                });
                                
                                x += box.width;
                                log.debug('Placed current box in new container:', box);
                            } else {
                                log.debug('Current box still cannot fit in the new container:', box);
                            }
                        }
                    }
                });
                
                if (packedBoxesCMSheet.length > 0) {

                    allContainersCMSheet.push(
                    {
                        packedBoxes: packedBoxesCMSheet, 
                        containerListCMSheet: containerListCMSheet
                    });
                    
                }

                if (totPalletsPerLayer > 0) {
                    itemsPerLayerCMSheet.push(totPalletsPerLayer);
                }
            }

            // to generate 2 best options for item recommendation
            if (itemRecommendation === true || parsedBody.selectedStatus === "adjustedQty") {

                function getAllSelectedOption() {
                    // Extract selectedOption data
                    var selectedOption = parsedBody.selectedOption || [];
                    return selectedOption;
                }
            
                var boxesSelectedOption = getAllSelectedOption();
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
                    mergeObjects(bin, binCutsize);
                }
                if (hasFolio) {
                    mergeObjects(boxes, boxesFolio);
                    mergeObjects(bin, binFolio);
                }
                if (hasHoneycomb) {
                    mergeObjects(boxes, boxesHoneycomb);
                    mergeObjects(bin, binHoneycomb);
                }
                if (hasPulp) {
                    mergeObjects(boxes, boxesPulp);
                    mergeObjects(bin, binPulp);
                }
                if (hasBoxCover) {
                    mergeObjects(boxes, boxesBoxCover);
                    mergeObjects(bin, binBoxCover);
                }
                if (hasDAN) {
                    mergeObjects(boxes, boxesDAN);
                    mergeObjects(bin, binDAN);
                }
                if (hasDAOS) {
                    mergeObjects(boxes, boxesDAOS);
                    mergeObjects(bin, binDAOS);
                }
                if (hasDACP) {
                    mergeObjects(boxes, boxesDACP);
                    mergeObjects(bin, binDACP);
                }
                if (hasCMSheet) {
                    mergeObjects(boxes, boxesCMSheet);
                    mergeObjects(bin, binCMSheet);
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
                            log.debug('palletsAfterAddQty', palletsAfterAddQty);
                            log.debug('qtyToAdd', qtyToAdd);
                            while (palletsAfterAddQty > 0 && palletsAfterAddQty > box.binCutsize.maxWeight) {
                                qtyToAdd -= 0.1; // reduce 1 unit
                                palletsAfterAddQty = Math.floor(((qtyToAdd + InputQty) * 1000) / totalNetWeightPerPallet);
                            }

                        }

                        if (box.baseUnitAbbreviation) {
                            var baseUnit = box.baseUnitAbbreviation.toLowerCase();
                            box.weight = (box.weight * box.uomConversionRates[baseUnit]) / box.uomConversionRates.ton;
                            box.maxWeightTon = box.weight;
                        }

                        if (parsedBody.selectedStatus === "adjustedQty"){
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
            
                if (Object.keys(boxesSelectedOption).length > 0){
                    log.debug('boxesSelectedOption', boxesSelectedOption);
                }

                // Get top 2 recommendations where each option can have multiple items
                var recommendedOptions = recommendTop2Boxes(
                    allBoxes,
                    totalBalanceWeight,
                    balanceLength,
                    balanceWidth,
                    balanceHeight,
                    bin
                );
            
                log.debug('recommendedoptikons', recommendedOptions);
                if (recommendedOptions && recommendedOptions.length > 0) {
                    recommendedBestFitItems = {
                        option1: recommendedOptions.map(function(opt) {
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
        function recommendTop2Boxes(boxes, totalBalanceWeight, balanceLength, balanceWidth, balanceHeight, bin) {
            var allValidFits = [];
            var fitOptions = [];

            for (var i = 0; i < boxes.length; i++) {
                var box = boxes[i].box;
                var qtyToAdd = boxes[i].qtyToAdd;

                if (parsedBody.selectedStatus === "adjustedQty"){
                    var qtyToAdd = boxes[i].quantity;

                    // totalbalanceweight = no of pallet that still can fit in the container
                    var totalPalletWeight = Math.floor((totalBalanceWeight * box.netWeightPerPallet) / 1000);

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

                // var rotations = [
                //     { l: box.length, w: box.width, h: box.height },
                //     { l: box.width, w: box.length, h: box.height },
                // ];
                
                // for (var j = 0; j < rotations.length; j++) {
                //     var r = rotations[j];

                //     if (r.l <= balanceLength || r.w <= balanceWidth || r.h <= balanceHeight) {
                //         var fitL = Math.floor(bin.length / r.l);
                //         var fitW = Math.floor(bin.width / r.w);
                //         var fitH = Math.floor(bin.height / r.h);

                //         var palletsPerLayer = fitL * fitW;
                //         var maxByDimension = palletsPerLayer * fitH;

                //         if (parsedBody.selectedStatus === "adjustedQty"){
                //             var maxByWeight = boxes[i].quantity;
                //             var totalPalletWeight = maxByWeight * box.netWeightPerPallet;

                //             if (totalPalletWeight <= totalBalanceWeight) {
                //                 var palletsPerContainer = maxByWeight;
                //             } else {
                //                 var palletsPerContainer = 0;
                //             }

                //         } else {

                //             var maxByWeight = Math.floor((totalBalanceWeight * 1000) / box.netWeightPerPallet);
                //             var palletsPerContainer = Math.min(maxByDimension, maxByWeight);
                //         }

                //         log.debug('totalBalanceWeightzzzz', totalBalanceWeight);
                //         log.debug('box.netWeightPerPallet', box.netWeightPerPallet);
                //         log.debug('maxByWeight', maxByWeight);
                //         log.debug('maxByDimension', maxByDimension);
                //         log.debug('palletsPerContainer', palletsPerContainer);
                //         if (palletsPerContainer > 0) {
                //             var totalWeight = palletsPerContainer * box.netWeightPerPallet;

                //             allValidFits.push({
                //                 box: box,
                //                 rotation: { length: r.l, width: r.w, height: r.h },
                //                 palletsPerContainer: palletsPerContainer,
                //                 totalWeight: totalWeight
                //             });

                //             break; // Break after finding a valid rotation for this box
                //         }
                //     }
                // }
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

                if (fitOptions[k].type !== 'mixed'){
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
        
        // Ensure boxes are sorted by weight and volume before running the bin packing algorithm
        var sortedBoxesMixed = sortByWeightAndVolume(boxesMixed);
        var sortedBoxesCutsize = sortByWeightAndVolume(boxesCutsize);
        var sortedBoxesFolio = sortByWeightAndVolume(boxesFolio);
        var sortedBoxesHoneycomb = sortByWeightAndVolume(boxesHoneycomb);
        var sortedBoxesPulp = sortByWeightAndVolume(boxesPulp);
        var sortedBoxesCMSheet = sortByWeightAndVolume(boxesCMSheet);
        var sortedBoxesBoxCover = sortByWeightAndVolume(boxesBoxCover);
        var sortedBoxesDAN = sortByWeightAndVolume(boxesDAN);
        var sortedBoxesDAOS = sortByWeightAndVolume(boxesDAOS);
        var sortedBoxesDACP = sortByWeightAndVolume(boxesDACP);

        // Cutsize, Folio, Mixed Calculation
        greedyBinPacking(sortedBoxesMixed, sortedBoxesCutsize, sortedBoxesFolio, sortedBoxesHoneycomb, sortedBoxesPulp, sortedBoxesBoxCover, sortedBoxesDAN, sortedBoxesDAOS, sortedBoxesDACP, sortedBoxesCMSheet, binMixed, binCutsize, binFolio, binHoneycomb, binPulp, binBoxCover, binDAN, binDAOS, binDACP, binCMSheet);
        
        // Wrapper Calculation
        function calculateWrappers(binWrapper, boxesWrapper) {
            var binWidth = binWrapper.width;
            var binLength = binWrapper.length;
            var binHeight = binWrapper.height;
            
            var remainingWidth = binWidth;
            var remainingLength = binLength;
            var remainingHeight = binHeight;
            var x = 0;
            var y = 0;
            var z = 0;
            
            var colorMap = {};
            Object.keys(boxesWrapper).forEach(function (parent) {
                var items = boxesWrapper[parent];

                var totalNetWeightPerWrapper = 0;
                items.forEach(function (box) {
                    if (box.type === 'wrapper') {
                        totalNetWeightPerWrapper += box.netWeightPerWrapper;
                    }
                });

                try {
                    items.forEach(function (box) {
                        if (box.type === 'wrapper') {
                            
                            if (!colorMap[box.product]) {
                                colorMap[box.product] = colors[Object.keys(colorMap).length % colors.length];
                            }
                            var currentItemColor = colorMap[box.product]; // Get the color for the current item

                            if(box.baseUnitAbbreviation){
                                var baseUnit = box.baseUnitAbbreviation.toLowerCase();
                                box.weight = (box.weight * box.uomConversionRates[baseUnit]) / box.uomConversionRates.ton;
                                box.maxWeightTon = box.weight;
                            }

                            var totalWeight = 0;
                            var wrapperDiameter = box.diameter * 0.0393701;
                            var wrapperWidth = box.width * 0.0393701;

                            // formula that does not consider the remaining space after placing wrappers in the container
                            var wrapperArea = Math.PI * Math.pow((wrapperDiameter / 2), 2);
                            var wrappersPerLayer = Math.floor((binWrapper.width * binWrapper.length) / wrapperArea) || 1;
                            var wrappersPerContainer = Math.floor(box.weight / (box.netWeightPerWrapper / 1000)) || 1;

                            // Formulas that Consider Space After Placing Wrappers
                            // var alongWidth = Math.floor(binWrapper.width / wrapperDiameter);  
                            // var alongLength = Math.floor(binWrapper.length / wrapperDiameter); 
                            // var layers = Math.floor(binWrapper.height / wrapperWidth); 
                            // var wrappersPerLayer = alongWidth * alongLength;  // Wrappers per single layer
                            // var wrappersPerContainer = wrappersPerLayer * layers;  // Total Wrappers in the container
                            
                            var grossWeight = (box.grossWeightPerWrapper / 1000) * wrappersPerContainer;
                            var netWeight = (box.netWeightPerWrapper / 1000) * wrappersPerContainer;

                            if (wrappersPerLayer > wrappersPerContainer) {
                                wrappersPerLayer = wrappersPerContainer;
                            }

                            // Calculate total weight of all items
                            totalWeight += box.weight;
                            var recommendedWeight = Math.max(0, box.maxWeightTon - totalWeight);

                            // List recommended items if there's available weight
                            var recommendedItems = [];
                            if (recommendedWeight > 0) {
                                box.itemRecommendation.forEach(function (item) {
                                    var maxQuantity = Math.floor((recommendedWeight * 1000) / item.weight);

                                    // Ensure recommendations fit within available space and weight
                                    if (maxQuantity > 0) {
                                        recommendedItems.push({
                                            name: item.name,
                                            maxQuantity: maxQuantity,
                                            width: item.width,
                                            diameter: item.diameter,
                                            weight: item.weight,
                                            isPriority: item.name.toLowerCase().includes("double a") ? 1 : 0 // Prioritize Double A brand
                                        });
                                    }
                                });

                                // Sort recommendations by priority first, then by best fit (smallest volume)
                                recommendedItems.sort(function (a, b) {
                                    if (b.isPriority !== a.isPriority) {
                                        return b.isPriority - a.isPriority;
                                    }
                                    return (a.length * a.width * a.height) - (b.length * b.width * b.height); // Prefer smaller items
                                });

                                // Keep only the top 3-5 best fitting recommendations
                                recommendedItems = recommendedItems.slice(0, 5);
                            }

                            var parallelPositions = [];
                            var hexagonalPositions = [];

                            // parallel placement
                            var wrappersFitWidth = Math.floor(remainingWidth / wrapperDiameter);
                            var wrappersFitLength = Math.floor(remainingLength / wrapperDiameter);
                            var wrappersFitHeight = Math.floor(remainingHeight / wrapperWidth);

                            if(wrappersFitLength * wrappersFitWidth > wrappersPerLayer){
                                wrappersFitLength = wrappersPerLayer;
                            }

                            var maxWrappers = wrappersPerContainer; // Or set this dynamically based on the item
                            var placedCount = 0;

                            for (var h = 0; h < wrappersFitHeight; h++) {
                                for (var w = 0; w < wrappersFitWidth; w++) {
                                    for (var l = 0; l < wrappersFitLength; l++) {
                                        if (placedCount >= maxWrappers) break;

                                        var position = {
                                            color: currentItemColor,
                                            width: wrapperWidth,
                                            diameter: wrapperDiameter,
                                            x: w * wrapperDiameter,
                                            z: l * wrapperDiameter,
                                            y: h * wrapperWidth
                                        };

                                        // Check if the Wrapper fits before placing it
                                        if (
                                            position.x + wrapperDiameter <= remainingWidth &&
                                            position.z + wrapperDiameter <= remainingLength &&
                                            position.y + wrapperWidth <= remainingHeight
                                        ) {
                                            parallelPositions.push(position);
                                            placedCount++;

                                            if (placedCount >= maxWrappers) break;
                                        }
                                    }
                                    if (placedCount >= maxWrappers) break;
                                }
                                if (placedCount >= maxWrappers) break;
                            }

                            // hexagonal placement
                            var scaleFactor = 0.93;
                            var adjustedRadius = wrapperDiameter * scaleFactor / 2; 
                            var adjustedDiameter = wrapperDiameter * scaleFactor;   

                            var count = 0;
                            var nHorizontal = Math.floor(remainingWidth / (2 * adjustedRadius));  // Calculate the number of horizontal circles
                            var nVertical = Math.floor(remainingLength / (Math.sqrt(3) * adjustedRadius));  // Calculate the number of vertical layers
                            var totalWrappersInFirstLayer = 0;  // Calculate the number of Wrappers per layer
                            for (var i = 0; i < nVertical; i++) {
                                if (i % 2 === 0) { // Double row uses n
                                    totalWrappersInFirstLayer += nHorizontal;
                                } else { // Odd rows use n-1.
                                    totalWrappersInFirstLayer += (nHorizontal - 1);
                                }
                            }

                            var numberOfStackedLayers = Math.floor(remainingHeight / wrapperWidth);  // Calculate the number of layers that can be stacked vertically.
                            for (var layer = 0; layer < numberOfStackedLayers; layer++) {
                                y = layer * wrapperWidth; // Each floor is tall

                                z = 0;
                                for (var row = 0; row < nVertical; row++) {
                                    var wrappersInRow = (row % 2 === 0) ? nHorizontal : (nHorizontal - 1);
                                    var xOffset = (row % 2 === 0) ? 0 : adjustedRadius;

                                    for (var col = 0; col < wrappersInRow; col++) {

                                        if(count < maxWrappers){
                                            x = (col * 2 * adjustedRadius) + xOffset;
                                            if (x + adjustedRadius > remainingWidth || z + adjustedRadius > remainingLength) {
                                                continue; // Do not insert wrapper if it exceeds the space.
                                            }
    
                                           var position = {
                                                displayName: box.displayName,
                                                color: currentItemColor,
                                                width: wrapperWidth,
                                                diameter: adjustedDiameter,
                                                x: x,
                                                z: z,
                                                y: y
                                            };
                                            hexagonalPositions.push(position);
                                            count++;
                                        }
                                        
                                    }
                                    z += Math.sqrt(3) * adjustedRadius; // Row spacing (depth)
                                }
                            }

                            // comparison of hexagonal vs parallel
                            var bestFitPositions = (hexagonalPositions.length >= parallelPositions.length) ? hexagonalPositions : parallelPositions;
                            remainingHeight -= wrappersFitHeight * wrapperWidth;

                            containerListWrapper.push({
                                parent: parent,
                                type: box.type,
                                product: box.product,
                                internalId: box.internalId,
                                displayName: box.displayName,
                                weight: box.weight,
                                maxWeightTon: box.maxWeightTon,
                                grossWeight: grossWeight,
                                netWeight: netWeight,
                                wrappersPerContainer: bestFitPositions.length,
                                wrappersPerLayer: wrappersPerLayer,
                                recommendedItems: recommendedItems
                            });

                            packedBoxesWrapper.push({
                                type: "wrapper",
                                layersUsed: wrappersFitHeight,
                                grossWeight: grossWeight,
                                netWeight: netWeight,
                                weight: box.weight,
                                maxWeightTon: box.maxWeightTon,
                                wrappersPerLayer: wrappersPerLayer,
                                wrappersPerContainer: bestFitPositions.length,
                                minOccupiedHeight: binHeight - remainingHeight,
                                recommendedItems: recommendedItems,
                                item: bestFitPositions.map(function (pos) {
                                    return {
                                        product: box.product,
                                        internalId: box.internalId,
                                        displayName: box.displayName,
                                        color: pos.color,
                                        position: {
                                            x: pos.x,
                                            y: pos.y,
                                            z: pos.z
                                        },
                                        packedSize: {
                                            diameter: pos.diameter.toFixed(2),
                                            width: Math.round(pos.width)
                                        },
                                        type: "wrapper",
                                        pallet: false,
                                        remainingDimensions: {
                                            width: remainingWidth,
                                            length: remainingLength,
                                            height: remainingHeight
                                        },
                                    };
                                })
                            });

                        }
                    });
                } catch (e) {
                    log.error('Error processing wrapper item', e);
                }

            });

            if (packedBoxesWrapper.length > 0) {
                allContainersWrapper.push({
                    packedBoxes: packedBoxesWrapper,
                    containerListWrapper: containerListWrapper
                });
            }

            return allContainersWrapper;
        }

        // Roll Calculation
        function calculateRolls(binRoll, boxesRoll) {
            var binWidth = binRoll.width;
            var binLength = binRoll.length;
            var binHeight = binRoll.height;
            
            var remainingWidth = binWidth;
            var remainingLength = binLength;
            var remainingHeight = binHeight;
            var x = 0;
            var y = 0;
            var z = 0;
            
            var colorMap = {};
            Object.keys(boxesRoll).forEach(function (parent) {
                var items = boxesRoll[parent];

                var totalNetWeightPerRoll = 0;
                items.forEach(function (box) {
                    if (box.type === 'roll') {
                        totalNetWeightPerRoll += box.netWeightPerRoll;
                    }
                });

                try {
                    items.forEach(function (box) {
                        if (box.type === 'roll') {
                            
                            if (!colorMap[box.product]) {
                                colorMap[box.product] = colors[Object.keys(colorMap).length % colors.length];
                            }
                            var currentItemColor = colorMap[box.product]; // Get the color for the current item

                            if(box.baseUnitAbbreviation){
                                var baseUnit = box.baseUnitAbbreviation.toLowerCase();
                                box.weight = (box.weight * box.uomConversionRates[baseUnit]) / box.uomConversionRates.ton;
                                box.maxWeightTon = box.weight;
                            }

                            var totalWeight = 0;
                            var rollDiameter = box.diameter * 0.0393701;
                            var rollWidth = box.width * 0.0393701;

                            // formula that does not consider the remaining space after placing rolls in the container
                            var rollArea = Math.PI * Math.pow((rollDiameter / 2), 2);
                            var rollsPerLayer = Math.floor((binRoll.width * binRoll.length) / rollArea) || 1;
                            var rollsPerContainer = Math.floor(box.weight / (box.netWeightPerRoll / 1000)) || 1;

                            // Formulas that Consider Space After Placing Rolls
                            // var alongWidth = Math.floor(binRoll.width / rollDiameter);  
                            // var alongLength = Math.floor(binRoll.length / rollDiameter); 
                            // var layers = Math.floor(binRoll.height / rollWidth); 
                            // var rollsPerLayer = alongWidth * alongLength;  // Rolls per single layer
                            // var rollsPerContainer = rollsPerLayer * layers;  // Total rolls in the container
                            
                            var grossWeight = (box.grossWeightPerRoll / 1000) * rollsPerContainer;
                            var netWeight = (box.netWeightPerRoll / 1000) * rollsPerContainer;

                            if (rollsPerLayer > rollsPerContainer) {
                                rollsPerLayer = rollsPerContainer;
                            }

                            // Calculate total weight of all items
                            totalWeight += box.weight;
                            var recommendedWeight = Math.max(0, box.maxWeightTon - totalWeight);

                            // List recommended items if there's available weight
                            var recommendedItems = [];
                            if (recommendedWeight > 0) {
                                box.itemRecommendation.forEach(function (item) {
                                    var maxQuantity = Math.floor((recommendedWeight * 1000) / item.weight);

                                    // Ensure recommendations fit within available space and weight
                                    if (maxQuantity > 0) {
                                        recommendedItems.push({
                                            name: item.name,
                                            maxQuantity: maxQuantity,
                                            width: item.width,
                                            diameter: item.diameter,
                                            weight: item.weight,
                                            isPriority: item.name.toLowerCase().includes("double a") ? 1 : 0 // Prioritize Double A brand
                                        });
                                    }
                                });

                                // Sort recommendations by priority first, then by best fit (smallest volume)
                                recommendedItems.sort(function (a, b) {
                                    if (b.isPriority !== a.isPriority) {
                                        return b.isPriority - a.isPriority;
                                    }
                                    return (a.length * a.width * a.height) - (b.length * b.width * b.height); // Prefer smaller items
                                });

                                // Keep only the top 3-5 best fitting recommendations
                                recommendedItems = recommendedItems.slice(0, 5);
                            }

                            var parallelPositions = [];
                            var hexagonalPositions = [];

                            // parallel placement
                            var rollsFitWidth = Math.floor(remainingWidth / rollDiameter);
                            var rollsFitLength = Math.floor(remainingLength / rollDiameter);
                            var rollsFitHeight = Math.floor(remainingHeight / rollWidth);

                            if(rollsFitLength * rollsFitWidth > rollsPerLayer){
                                rollsFitLength = rollsPerLayer;
                            }

                            var maxRolls = rollsPerContainer; // Or set this dynamically based on the item
                            var placedCount = 0;

                            for (var h = 0; h < rollsFitHeight; h++) {
                                for (var w = 0; w < rollsFitWidth; w++) {
                                    for (var l = 0; l < rollsFitLength; l++) {
                                        if (placedCount >= maxRolls) break;

                                        var position = {
                                            color: currentItemColor,
                                            width: rollWidth,
                                            diameter: rollDiameter,
                                            x: w * rollDiameter,
                                            z: l * rollDiameter,
                                            y: h * rollWidth
                                        };

                                        // Check if the roll fits before placing it
                                        if (
                                            position.x + rollDiameter <= remainingWidth &&
                                            position.z + rollDiameter <= remainingLength &&
                                            position.y + rollWidth <= remainingHeight
                                        ) {
                                            parallelPositions.push(position);
                                            placedCount++;

                                            if (placedCount >= maxRolls) break;
                                        }
                                    }
                                    if (placedCount >= maxRolls) break;
                                }
                                if (placedCount >= maxRolls) break;
                            }

                            // hexagonal placement
                            var scaleFactor = 0.93;
                            var adjustedRadius = rollDiameter * scaleFactor / 2; 
                            var adjustedDiameter = rollDiameter * scaleFactor;   

                            var count = 0;
                            var nHorizontal = Math.floor(remainingWidth / (2 * adjustedRadius));  // Calculate the number of horizontal circles
                            var nVertical = Math.floor(remainingLength / (Math.sqrt(3) * adjustedRadius));  // Calculate the number of vertical layers
                            var totalRollsInFirstLayer = 0;  // Calculate the number of rolls per layer
                            for (var i = 0; i < nVertical; i++) {
                                if (i % 2 === 0) { // Double row uses n
                                    totalRollsInFirstLayer += nHorizontal;
                                } else { // Odd rows use n-1.
                                    totalRollsInFirstLayer += (nHorizontal - 1);
                                }
                            }

                            var numberOfStackedLayers = Math.floor(remainingHeight / rollWidth);  // Calculate the number of layers that can be stacked vertically.
                            
                            for (var layer = 0; layer < numberOfStackedLayers; layer++) {
                                y = layer * rollWidth; // Each floor is tall

                                z = 0;
                                for (var row = 0; row < nVertical; row++) {
                                    var rollsInRow = (row % 2 === 0) ? nHorizontal : (nHorizontal - 1);
                                    var xOffset = (row % 2 === 0) ? 0 : adjustedRadius;

                                    for (var col = 0; col < rollsInRow; col++) {

                                        if(count < maxRolls){
                                            x = (col * 2 * adjustedRadius) + xOffset;
                                            if (x + adjustedRadius > remainingWidth || z + adjustedRadius > remainingLength) {
                                                continue; // Do not insert roll if it exceeds the space.
                                            }
    
                                           var position = {
                                                displayName: box.displayName,
                                                color: currentItemColor,
                                                width: rollWidth,
                                                diameter: adjustedDiameter,
                                                x: x,
                                                z: z,
                                                y: y
                                            };
                                            hexagonalPositions.push(position);
                                            count++;
                                        }
                                        
                                    }
                                    z += Math.sqrt(3) * adjustedRadius; // Row spacing (depth)
                                }
                            }

                            // comparison of hexagonal vs parallel
                            var bestFitPositions = (hexagonalPositions.length >= parallelPositions.length) ? hexagonalPositions : parallelPositions;
                            remainingHeight -= rollsFitHeight * rollWidth;

                            if (rollsPerContainer !== bestFitPositions.length){
                                netWeight = (box.netWeightPerRoll / 1000) * bestFitPositions.length;
                                grossWeight = (box.grossWeightPerRoll / 1000) * bestFitPositions.length;
                            }


                            // Pack into current container
                            containerListRoll.push({
                                parent: parent,
                                type: box.type,
                                product: box.product,
                                internalId: box.internalId,
                                displayName: box.displayName,
                                weight: box.weight,
                                maxWeightTon: box.maxWeightTon,
                                grossWeight: grossWeight,
                                netWeight: netWeight,
                                rollsPerContainer: bestFitPositions.length,
                                rollsPerLayer: rollsPerLayer,
                                recommendedItems: recommendedItems
                            });

                            packedBoxesRoll.push({
                                type: "Roll",
                                layersUsed: rollsFitHeight,
                                grossWeight: grossWeight,
                                netWeight: netWeight,
                                weight: box.weight,
                                maxWeightTon: box.maxWeightTon,
                                rollsPerLayer: rollsPerLayer,
                                rollsPerContainer: bestFitPositions.length,
                                minOccupiedHeight: binHeight - remainingHeight,
                                recommendedItems: recommendedItems,
                                item: bestFitPositions.map(function (pos) {
                                    return {
                                        product: box.product,
                                        internalId: box.internalId,
                                        displayName: box.displayName,
                                        color: pos.color,
                                        position: {
                                            x: pos.x,
                                            y: pos.y,
                                            z: pos.z
                                        },
                                        packedSize: {
                                            diameter: pos.diameter.toFixed(2),
                                            width: Math.round(pos.width)
                                        },
                                        type: "Roll",
                                        pallet: false,
                                        remainingDimensions: {
                                            width: remainingWidth,
                                            length: remainingLength,
                                            height: remainingHeight
                                        },
                                    };
                                })
                            });

                            // ✅ If no space left → close current container and start a new one
                            if (remainingHeight < rollWidth) {
                                allContainersRoll.push({
                                    packedBoxes: packedBoxesRoll,
                                    containerListRoll: containerListRoll
                                });

                                // Reset for a new container
                                packedBoxesRoll = [];
                                containerListRoll = [];
                                remainingHeight = binHeight;
                            }

                        }
                    });
                } catch (e) {
                    log.error('Error processing roll item', e);
                }

            });

            if (packedBoxesRoll.length > 0) {
                allContainersRoll.push({
                    packedBoxes: packedBoxesRoll,
                    containerListRoll: containerListRoll
                });
            }

            return allContainersRoll;
        }

        // CM Roll Calculation
        function calculateCMRolls(binCMRoll, boxesCMRoll) {
            var binWidth = binCMRoll.width;
            var binLength = binCMRoll.length;
            var binHeight = binCMRoll.height;
            
            var remainingWidth = binWidth;
            var remainingLength = binLength;
            var remainingHeight = binHeight;
            var x = 0;
            var y = 0;
            var z = 0;
            
            var colorMap = {};
            Object.keys(boxesCMRoll).forEach(function (parent) {
                var items = boxesCMRoll[parent];

                var totalNetWeightPerCMRoll = 0;
                items.forEach(function (box) {
                    if (box.type === 'CM Roll') {
                        totalNetWeightPerCMRoll += box.netWeightPerCMRoll;
                    }
                });

                try {
                    items.forEach(function (box) {
                        if (box.type === 'CM Roll') {
                            
                            if (!colorMap[box.product]) {
                                colorMap[box.product] = colors[Object.keys(colorMap).length % colors.length];
                            }
                            var currentItemColor = colorMap[box.product]; // Get the color for the current item

                            if(box.baseUnitAbbreviation){
                                var baseUnit = box.baseUnitAbbreviation.toLowerCase();
                                box.weight = (box.weight * box.uomConversionRates[baseUnit]) / box.uomConversionRates.ton;
                                box.maxWeightTon = box.weight;
                            }

                            var totalWeight = 0;
                            var cmRollDiameter = box.diameter * 0.0393701;
                            var cmRollWidth = box.width * 0.0393701;

                            // formula that does not consider the remaining space after placing rolls in the container
                            var cmRollArea = Math.PI * Math.pow((cmRollDiameter / 2), 2);
                            var cmRollsPerLayer = Math.floor((binCMRoll.width * binCMRoll.length) / cmRollArea) || 1;
                            var cmRollsPerContainer = Math.floor(box.weight / (box.netWeightPerCMRoll / 1000)) || 1;
                            
                            var grossWeight = (box.grossWeightPerCMRoll / 1000) * cmRollsPerContainer;
                            var netWeight = (box.netWeightPerCMRoll / 1000) * cmRollsPerContainer;

                            if (cmRollsPerLayer > cmRollsPerContainer) {
                                cmRollsPerLayer = cmRollsPerContainer;
                            }

                            // Calculate total weight of all items
                            totalWeight += box.weight;
                            var recommendedWeight = Math.max(0, box.maxWeightTon - totalWeight);

                            // List recommended items if there's available weight
                            var recommendedItems = [];
                            if (recommendedWeight > 0) {
                                box.itemRecommendation.forEach(function (item) {
                                    var maxQuantity = Math.floor((recommendedWeight * 1000) / item.weight);

                                    // Ensure recommendations fit within available space and weight
                                    if (maxQuantity > 0) {
                                        recommendedItems.push({
                                            name: item.name,
                                            maxQuantity: maxQuantity,
                                            width: item.width,
                                            diameter: item.diameter,
                                            weight: item.weight,
                                            isPriority: item.name.toLowerCase().includes("double a") ? 1 : 0 // Prioritize Double A brand
                                        });
                                    }
                                });

                                // Sort recommendations by priority first, then by best fit (smallest volume)
                                recommendedItems.sort(function (a, b) {
                                    if (b.isPriority !== a.isPriority) {
                                        return b.isPriority - a.isPriority;
                                    }
                                    return (a.length * a.width * a.height) - (b.length * b.width * b.height); // Prefer smaller items
                                });

                                // Keep only the top 3-5 best fitting recommendations
                                recommendedItems = recommendedItems.slice(0, 5);
                            }

                            var parallelPositions = [];
                            var hexagonalPositions = [];

                            // parallel placement
                            var cmRollsFitWidth = Math.floor(remainingWidth / cmRollDiameter);
                            var cmRollsFitLength = Math.floor(remainingLength / cmRollDiameter);
                            var cmRollsFitHeight = Math.floor(remainingHeight / cmRollWidth);

                            if(cmRollsFitLength * cmRollsFitWidth > cmRollsPerLayer){
                                cmRollsFitLength = cmRollsPerLayer;
                            }

                            var maxCMRolls = cmRollsPerContainer; // Or set this dynamically based on the item
                            var placedCount = 0;

                            for (var h = 0; h < cmRollsFitHeight; h++) {
                                for (var w = 0; w < cmRollsFitWidth; w++) {
                                    for (var l = 0; l < cmRollsFitLength; l++) {
                                        if (placedCount >= maxCMRolls) break;

                                        var position = {
                                            color: currentItemColor,
                                            width: cmRollWidth,
                                            diameter: cmRollDiameter,
                                            x: w * cmRollDiameter,
                                            z: l * cmRollDiameter,
                                            y: h * cmRollWidth
                                        };

                                        // Check if the roll fits before placing it
                                        if (
                                            position.x + cmRollDiameter <= remainingWidth &&
                                            position.z + cmRollDiameter <= remainingLength &&
                                            position.y + cmRollWidth <= remainingHeight
                                        ) {
                                            parallelPositions.push(position);
                                            placedCount++;

                                            if (placedCount >= maxCMRolls) break;
                                        }
                                    }
                                    if (placedCount >= maxCMRolls) break;
                                }
                                if (placedCount >= maxCMRolls) break;
                            }

                            // hexagonal placement
                            var scaleFactor = 0.93;
                            var adjustedRadius = cmRollDiameter * scaleFactor / 2; 
                            var adjustedDiameter = cmRollDiameter * scaleFactor;   

                            var count = 0;
                            var nHorizontal = Math.floor(remainingWidth / (2 * adjustedRadius));  // Calculate the number of horizontal circles
                            var nVertical = Math.floor(remainingLength / (Math.sqrt(3) * adjustedRadius));  // Calculate the number of vertical layers
                            var totalCMRollsInFirstLayer = 0;  // Calculate the number of CM rolls per layer
                            for (var i = 0; i < nVertical; i++) {
                                if (i % 2 === 0) { // Double row uses n
                                    totalCMRollsInFirstLayer += nHorizontal;
                                } else { // Odd rows use n-1.
                                    totalCMRollsInFirstLayer += (nHorizontal - 1);
                                }
                            }

                            var numberOfStackedLayers = Math.floor(remainingHeight / cmRollWidth);  // Calculate the number of layers that can be stacked vertically.
                            for (var layer = 0; layer < numberOfStackedLayers; layer++) {
                                y = layer * cmRollWidth; // Each floor is tall

                                z = 0;
                                for (var row = 0; row < nVertical; row++) {
                                    var cmRollsInRow = (row % 2 === 0) ? nHorizontal : (nHorizontal - 1);
                                    var xOffset = (row % 2 === 0) ? 0 : adjustedRadius;

                                    for (var col = 0; col < cmRollsInRow; col++) {

                                        if(count < maxCMRolls){
                                            x = (col * 2 * adjustedRadius) + xOffset;
                                            if (x + adjustedRadius > remainingWidth || z + adjustedRadius > remainingLength) {
                                                continue; // Do not insert CM roll if it exceeds the space.
                                            }

                                        var position = {
                                                displayName: box.displayName,
                                                color: currentItemColor,
                                                width: cmRollWidth,
                                                diameter: adjustedDiameter,
                                                x: x,
                                                z: z,
                                                y: y
                                            };
                                            hexagonalPositions.push(position);
                                            count++;
                                        }
                                        
                                    }
                                    z += Math.sqrt(3) * adjustedRadius; // Row spacing (depth)
                                }
                            }

                            // comparison of hexagonal vs parallel
                            var bestFitPositions = (hexagonalPositions.length >= parallelPositions.length) ? hexagonalPositions : parallelPositions;
                            remainingHeight -= cmRollsFitHeight * cmRollWidth;

                            containerListCMRoll.push({
                                parent: parent,
                                type: box.type,
                                product: box.product,
                                internalId: box.internalId,
                                displayName: box.displayName,
                                weight: box.weight,
                                maxWeightTon: box.maxWeightTon,
                                grossWeight: grossWeight,
                                netWeight: netWeight,
                                cmRollsPerContainer: bestFitPositions.length,
                                cmRollsPerLayer: cmRollsPerLayer,
                                recommendedItems: recommendedItems
                            });

                            packedBoxesCMRoll.push({
                                type: "CM Roll",
                                layersUsed: cmRollsFitHeight,
                                grossWeight: grossWeight,
                                netWeight: netWeight,
                                weight: box.weight,
                                maxWeightTon: box.maxWeightTon,
                                cmRollsPerLayer: cmRollsPerLayer,
                                cmRollsPerContainer: bestFitPositions.length,
                                minOccupiedHeight: binHeight - remainingHeight,
                                recommendedItems: recommendedItems,
                                item: bestFitPositions.map(function (pos) {
                                    return {
                                        product: box.product,
                                        internalId: box.internalId,
                                        displayName: box.displayName,
                                        color: pos.color,
                                        position: {
                                            x: pos.x,
                                            y: pos.y,
                                            z: pos.z
                                        },
                                        packedSize: {
                                            diameter: pos.diameter.toFixed(2),
                                            width: Math.round(pos.width)
                                        },
                                        type: "CM Roll",
                                        pallet: false,
                                        remainingDimensions: {
                                            width: remainingWidth,
                                            length: remainingLength,
                                            height: remainingHeight
                                        },
                                    };
                                })
                            });

                        }
                    });
                } catch (e) {
                    log.error('Error processing CM Roll item', e);
                }

            });

            if (packedBoxesCMRoll.length > 0) {
                allContainersCMRoll.push({
                    packedBoxes: packedBoxesCMRoll,
                    containerListCMRoll: containerListCMRoll
                });
            }

            return allContainersCMRoll;
        }

        var recommendedItems = 0;
        var sortedRecommendedItems = 0;
        var layerCountForContainer = 0;
        var uniqueItems = new Set(); // Using a Set to track unique internalIds
        var totalReamsMixed = 0;
        var totalBoxesMixed = 0;
        var totalPalletsMixed = 0;
        var totalReamsCutsize = 0;
        var totalBoxesCutsize = 0;
        var totalPalletsCutsize = 0;
        var totalReamsFolio = 0;
        var totalBoxesFolio = 0;
        var totalPalletsFolio = 0;
        var totalReamsHoneycomb = 0;
        var totalBoxesHoneycomb = 0;
        var totalPalletsHoneycomb = 0;
        var totalPalletsPulp = 0;
        var totalBalesPulp = 0;
        var totalUnitsPulp = 0;
        var totalPalletsBoxCover = 0;
        var totalPcsBoxCover = 0;
        var totalReamsDAN = 0;
        var totalPalletsDAN = 0;
        var totalPacksDAN = 0;
        var totalReamsDAOS = 0;
        var totalBoxesDAOS = 0;
        var totalPalletsDAOS = 0;
        var totalReamsDACP = 0;
        var totalBoxesDACP = 0;
        var totalPalletsDACP = 0;
        var totalReamsCMSheet = 0;
        var totalBoxesCMSheet = 0;
        var totalPalletsCMSheet = 0;
        var totalPacksCMSheet = 0;
        var totalRollsWrapper = 0;
        var finalWrappersPerContainer = []; 
        var totalPalletsRoll = 0;
        var finalrollsPerContainer = []; 
        var totalPalletsCMRoll = 0;
        var finalCMRollsPerContainer = []; 
        var containerIncrementedMixed = false;
        var containerIncrementedCutsize = false;
        var containerIncrementedFolio = false;
        var containerIncrementedHoneycomb = false;
        var containerIncrementedPulp = false;
        var containerIncrementedBoxCover = false;
        var containerIncrementedDAN = false;
        var containerIncrementedDAOS = false;
        var containerIncrementedDACP = false;
        var containerIncrementedCMSheet = false;
        var containerIncrementedWrapper = false;
        var containerIncrementedRoll = false;
        var containerIncrementedCMRoll = false;

        var mixedResult3D = allContainersMixed.map(function (containerWrapper, containerIndex) {
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
            var type = null;
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
                    totalPalletsMixed += container[i].palletsPerContainer || 0;

                    uniqueParent[product] = true; // Mark as added
                }
                recommendedItems = container[i].recommendedItems;
                sortedRecommendedItems = container[i].sortedRecommendedItems;
                minOccupiedHeight = container[i].minOccupiedHeight;
                type = container[i].type;
                
            }

            totalReamsMixed = totalReamsPerContainer;
            totalBoxesMixed = totalBoxesPerContainer;
            layerCountForContainer += 1;

            return {
                containerIndex: containerIndex + 1, 
                type: type,
                layersUsed: layerCountForContainer,
                palletsPerLayer: palletsPerLayer,
                palletsPerContainer: noOfPallets,
                width: binMixed.width,        // Bin width for Mixed
                height: binMixed.height,      // Bin height for Mixed
                length: binMixed.length,      // Bin length for Mixed
                containerNetWeight: containerNetWeight,
                containerNetWeightKG: containerNetWeightKG,
                containerGrossWeight: containerGrossWeight,
                containerGrossWeightKG: containerGrossWeightKG,
                reams: reams,
                boxes: boxes,
                totalReamsPerContainer: totalReamsMixed,
                totalBoxesPerContainer: totalBoxesMixed,

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
                sortedRecommendedItems: sortedRecommendedItems,

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
        var mixedResultConcal = allContainersMixed
            .map(function (containerWrapper, containerIndex) {
                var containerList = containerWrapper.containerListMixed;

                var filteredItems = containerList
                    .filter(function (packedBox) {
                        if (!uniqueItems.has(packedBox.internalId)) {
                            uniqueItems.add(packedBox.internalId);
                            return true;
                        }
                        return false;
                    })
                    .map(function (packedBox) {

                        packedBox.reamsPerContainer = packedBox.reamsPerContainer || 0;
                        packedBox.boxesPerContainer = packedBox.boxesPerContainer || 0;
                        packedBox.palletsPerContainer = packedBox.palletsPerContainer || 0;
                        packedBox.palletsPerLayer = packedBox.palletsPerLayer || 0;

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
                            reams: packedBox.reamsPerContainer + ' RM',
                            boxes: packedBox.boxesPerContainer + ' CAR',
                            palletsPerContainer: packedBox.palletsPerContainer + ' PAL',
                            palletsPerLayer: packedBox.palletsPerLayer + ' PAL',
                            productLayer: packedBox.productLayer,
                            price: 0.0 // Match folioResultConcal structure
                        };
                    });

            
                if (!containerIncrementedMixed) {
                    containerNo = containerNo + 1;
                    containerIncrementedMixed = true;
                }

                totalReamsMixed = totalReamsMixed || 0;
                totalBoxesMixed = totalBoxesMixed || 0;
                totalPalletsMixed = totalPalletsMixed || 0;
                
                return filteredItems.length > 0 // Only return containers with items
                    ? {
                        containerIndex: containerNo,
                        containerSize: binMixed,
                        totalReamsCopyPaper: totalReamsMixed + ' RM',
                        totalBoxesCopyPaper: totalBoxesMixed + ' CAR',
                        totalPalletsCopyPaper: totalPalletsMixed + ' PAL',
                        item: filteredItems,
                    }
                    : null; // Return null for empty containers
            })
            .filter(Boolean); // Remove all null values (empty containers)

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
                width: binCutsize.width,        // Bin width for Cutsize
                height: binCutsize.height,      // Bin height for Cutsize
                length: binCutsize.length,      // Bin length for Cutsize
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
        log.debug('allrecordcutsize', allRecordCutsize);
        log.debug('allrecordcutsize.length', allRecordCutsize.length);
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
                containerSize: binCutsize,
                totalReamsCopyPaper: (Math.floor(totalReamsCutsize) || 0) + ' RM',
                totalBoxesCopyPaper: (Math.floor(totalBoxesCutsize) || 0) + ' CAR',
                totalPalletsCopyPaper: (Math.floor(totalPalletsCopyPaper) || 0) + ' PAL',
                item: formattedItems
            };
        });

        
        var folioResult3D = allContainersFolio.map(function (containerWrapper, containerIndex) {
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
            var totalBoxesPerContainer = 0;

            for (var i = 0; i < container.length; i++) {

                var netWeight = container[i].netWeight.toFixed(3);
                var netWeightKG = container[i].netWeight.toFixed(3) * 1000;
                var weight = container[i].grossWeight.toFixed(3);
                var weightKG = container[i].grossWeight.toFixed(3) * 1000;
                var pallets = container[i].palletsPerContainer;
                var product = container[i].product;
                
                if (!uniqueParent[product]) { // Check if weight is already added
                    containerNetWeight.push(netWeight);
                    containerNetWeightKG.push(netWeightKG);
                    containerGrossWeight.push(weight);
                    containerGrossWeightKG.push(weightKG);
                    noOfPallets.push(pallets);
                    palletsPerLayer.push(container[i].palletsPerLayer);
                    reams.push(container[i].reamsPerContainer);
                    boxes.push(container[i].boxesPerContainer);
                    totalReamsFolio += container[i].reamsPerContainer;
                    totalBoxesPerContainer += container[i].boxesPerContainer;
                    totalPalletsFolio += container[i].palletsPerContainer || 0;

                    uniqueParent[product] = true; // Mark as added
                    recommendedItems = container[i].recommendedItems;
                }
            }

            totalBoxesFolio = totalBoxesPerContainer || 0;
            return {
                containerIndex: containerIndex + 1, 
                type: 'Folio',
                layersUsed: layerCountForContainer + 1,
                // palletsPerLayer: itemsPerLayerFolio,
                palletsPerLayer: palletsPerLayer,
                palletsPerContainer: noOfPallets,
                width: binFolio.width,        
                height: binFolio.height,      
                length: binFolio.length,      
                containerNetWeight: containerNetWeight,
                containerNetWeightKG: containerNetWeightKG,
                containerGrossWeight: containerGrossWeight,
                containerGrossWeightKG: containerGrossWeightKG,
                reams: reams,
                boxes: boxes,

                recommendedItems: recommendedItems && recommendedItems.length > 0
                    ? recommendedItems.map(function (item) {
                        return {
                            name: item.name,
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
        var folioResultConcal = allContainersFolio
            .map(function (containerWrapper, containerIndex) {
                var containerList = containerWrapper.containerListFolio;

                var filteredItems = containerList
                    .filter(function (packedBox) {
                        if (!uniqueItems.has(packedBox.internalId)) {
                            uniqueItems.add(packedBox.internalId);
                            return true;
                        }
                        return false;
                    })
                    .map(function (packedBox) {

                        packedBox.reamsPerContainer = packedBox.reamsPerContainer || 0;
                        packedBox.boxesPerContainer = packedBox.boxesPerContainer || 0;
                        packedBox.palletsPerContainer = packedBox.palletsPerContainer || 0;
                        packedBox.palletsPerLayer = packedBox.palletsPerLayer || 0;

                        return {
                            product: packedBox.product,
                            internalId: packedBox.internalId,
                            displayName: packedBox.displayName,
                            type: packedBox.type,
                            layer: packedBox.layer,
                            netWeight: packedBox.netWeight.toFixed(3),
                            netWeightKG: (packedBox.netWeight * 1000).toFixed(3),
                            grossWeight: packedBox.grossWeight.toFixed(3),
                            grossWeightKG: (packedBox.grossWeight * 1000).toFixed(3),
                            reams: packedBox.reamsPerContainer + ' RM',
                            boxes: packedBox.boxesPerContainer + ' CAR',
                            palletsPerContainer: packedBox.palletsPerContainer + ' PAL',
                            palletsPerLayer: packedBox.palletsPerLayer + ' PAL',
                            productLayer: packedBox.productLayer,
                            price: 0.0
                        };
                    });

                if (!containerIncrementedFolio) {
                    containerNo = containerNo + 1;
                    containerIncrementedFolio = true;
                }

                totalReamsFolio = totalReamsFolio || 0;
                totalBoxesFolio = totalBoxesFolio || 0;
                totalPalletsFolio = totalPalletsFolio || 0;

                return filteredItems.length > 0 // Only return containers with items
                    ? {
                        containerIndex: containerNo,
                        containerSize: binFolio,
                        totalReamsFolio: totalReamsFolio + ' RM',
                        totalBoxesFolio: totalBoxesFolio + ' CAR',
                        totalPalletsFolio: totalPalletsFolio + ' PAL',
                        item: filteredItems,
                    }
                    : null; // Return null for empty containers
            })
            .filter(Boolean); // Remove all null values (empty containers)

        var honeycombResult3D = allContainersHoneycomb.map(function (containerWrapper, containerIndex) {
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
            var totalBoxesPerContainer = 0;

            for (var i = 0; i < container.length; i++) {

                var netWeight = container[i].netWeight.toFixed(3);
                var netWeightKG = container[i].netWeight.toFixed(3) * 1000;
                var weight = container[i].grossWeight.toFixed(3);
                var weightKG = container[i].grossWeight.toFixed(3) * 1000;
                var pallets = container[i].palletsPerContainer;
                var product = container[i].product;
                
                if (!uniqueParent[product]) { // Check if weight is already added
                    containerNetWeight.push(netWeight);
                    containerNetWeightKG.push(netWeightKG);
                    containerGrossWeight.push(weight);
                    containerGrossWeightKG.push(weightKG);
                    noOfPallets.push(pallets);
                    palletsPerLayer.push(container[i].palletsPerLayer);
                    reams.push(container[i].reamsPerContainer);
                    boxes.push(container[i].boxesPerContainer);
                    totalReamsHoneycomb += container[i].reamsPerContainer;
                    totalBoxesPerContainer += container[i].boxesPerContainer;
                    totalPalletsHoneycomb += container[i].palletsPerContainer || 0;

                    uniqueParent[product] = true; // Mark as added
                    recommendedItems = container[i].recommendedItems;
                }
            }

            totalBoxesHoneycomb = totalBoxesPerContainer || 0;
            return {
                containerIndex: containerIndex + 1, 
                type: 'honeycomb',
                layersUsed: layerCountForContainer + 1,
                // palletsPerLayer: itemsPerLayerHoneycomb,
                palletsPerLayer: palletsPerLayer,
                palletsPerContainer: noOfPallets,
                width: binHoneycomb.width,        
                height: binHoneycomb.height,      
                length: binHoneycomb.length,      
                containerNetWeight: containerNetWeight,
                containerNetWeightKG: containerNetWeightKG,
                containerGrossWeight: containerGrossWeight,
                containerGrossWeightKG: containerGrossWeightKG,
                reams: reams,
                boxes: boxes,

                recommendedItems: recommendedItems && recommendedItems.length > 0
                    ? recommendedItems.map(function (item) {
                        return {
                            name: item.name,
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
        var honeycombResultConcal = allContainersHoneycomb
            .map(function (containerWrapper, containerIndex) {
                var containerList = containerWrapper.containerListHoneycomb;

                var filteredItems = containerList
                    .filter(function (packedBox) {
                        if (!uniqueItems.has(packedBox.internalId)) {
                            uniqueItems.add(packedBox.internalId);
                            return true;
                        }
                        return false;
                    })
                    .map(function (packedBox) {

                        packedBox.boxesPerContainer = packedBox.boxesPerContainer || 0;
                        packedBox.palletsPerContainer = packedBox.palletsPerContainer || 0;
                        packedBox.palletsPerLayer = packedBox.palletsPerLayer || 0;

                        return {
                            product: packedBox.product,
                            internalId: packedBox.internalId,
                            displayName: packedBox.displayName,
                            type: packedBox.type,
                            layer: packedBox.layer,
                            netWeight: packedBox.netWeight.toFixed(3),
                            netWeightKG: (packedBox.netWeight * 1000).toFixed(3),
                            grossWeight: packedBox.grossWeight.toFixed(3),
                            grossWeightKG: (packedBox.grossWeight * 1000).toFixed(3),
                            boxes: packedBox.boxesPerContainer + ' BOX',
                            palletsPerContainer: packedBox.palletsPerContainer + ' PAL',
                            palletsPerLayer: packedBox.palletsPerLayer + ' PAL',
                            productLayer: packedBox.productLayer,
                            price: 0.0
                        };
                    });

                if (!containerIncrementedHoneycomb) {
                    containerNo = containerNo + 1;
                    containerIncrementedHoneycomb = true;
                }
                
                totalBoxesHoneycomb = totalBoxesHoneycomb || 0;
                totalPalletsHoneycomb = totalPalletsHoneycomb || 0;

                return filteredItems.length > 0 // Only return containers with items
                    ? {
                        containerIndex: containerNo,
                        containerSize: binHoneycomb,
                        totalBoxesHoneycomb: totalBoxesHoneycomb + ' BOX',
                        totalPalletsHoneycomb: totalPalletsHoneycomb + ' PAL',
                        item: filteredItems,
                    }
                    : null; // Return null for empty containers
            })
            .filter(Boolean); // Remove all null values (empty containers)
        
        var pulpResult3D = allContainersPulp.map(function (containerWrapper, containerIndex) {
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
            var bales = [];
            var units = [];
            var totalBoxesPerContainer = 0;

            for (var i = 0; i < container.length; i++) {

                var netWeight = container[i].netWeight.toFixed(3);
                var netWeightKG = container[i].netWeight.toFixed(3) * 1000;
                var weight = container[i].grossWeight.toFixed(3);
                var weightKG = container[i].grossWeight.toFixed(3) * 1000;
                var pallets = container[i].palletsPerContainer;
                var product = container[i].product;
                
                if (!uniqueParent[product]) { // Check if weight is already added
                    containerNetWeight.push(netWeight);
                    containerNetWeightKG.push(netWeightKG);
                    containerGrossWeight.push(weight);
                    containerGrossWeightKG.push(weightKG);
                    noOfPallets.push(pallets);
                    palletsPerLayer.push(container[i].palletsPerLayer);
                    bales.push(container[i].balesPerContainer);
                    units.push(container[i].unitsPerContainer);
                    totalBoxesPerContainer += container[i].boxesPerContainer;
                    totalPalletsPulp += container[i].palletsPerContainer || 0;
                    totalBalesPulp += container[i].balesPerContainer || 0;
                    totalUnitsPulp += container[i].unitsPerContainer || 0;

                    uniqueParent[product] = true; // Mark as added
                    recommendedItems = container[i].recommendedItems;
                }
            }

            return {
                containerIndex: containerIndex + 1, 
                type: 'pulp',
                layersUsed: layerCountForContainer + 1,
                palletsPerLayer: palletsPerLayer,
                palletsPerContainer: noOfPallets,
                width: binPulp.width,        
                height: binPulp.height,      
                length: binPulp.length,      
                containerNetWeight: containerNetWeight,
                containerNetWeightKG: containerNetWeightKG,
                containerGrossWeight: containerGrossWeight,
                containerGrossWeightKG: containerGrossWeightKG,
                bales: bales,
                units: units,

                recommendedItems: recommendedItems && recommendedItems.length > 0
                    ? recommendedItems.map(function (item) {
                        return {
                            name: item.name,
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
        var pulpResultConcal = allContainersPulp
            .map(function (containerWrapper, containerIndex) {
                var containerList = containerWrapper.containerListPulp;

                var filteredItems = containerList
                    .filter(function (packedBox) {
                        if (!uniqueItems.has(packedBox.internalId)) {
                            uniqueItems.add(packedBox.internalId);
                            return true;
                        }
                        return false;
                    })
                    .map(function (packedBox) {
                        return {
                            product: packedBox.product,
                            internalId: packedBox.internalId,
                            displayName: packedBox.displayName,
                            type: packedBox.type,
                            layer: packedBox.layer,
                            netWeight: packedBox.netWeight.toFixed(3),
                            netWeightKG: (packedBox.netWeight * 1000).toFixed(3),
                            grossWeight: packedBox.grossWeight.toFixed(3),
                            grossWeightKG: (packedBox.grossWeight * 1000).toFixed(3),
                            bales: packedBox.balesPerContainer + ' BALES',
                            units: packedBox.unitsPerContainer + ' UNITS',
                            palletsPerContainer: packedBox.palletsPerContainer + ' PAL',
                            palletsPerLayer: packedBox.palletsPerLayer + ' PAL',
                            productLayer: packedBox.productLayer,
                            price: 0.0
                        };
                    });

                if (!containerIncrementedPulp) {
                    containerNo = containerNo + 1;
                    containerIncrementedPulp = true;
                }
                return filteredItems.length > 0 // Only return containers with items
                    ? {
                        containerIndex: containerNo,
                        containerSize: binPulp,
                        totalPalletsPulp: totalPalletsPulp + ' PAL',
                        totalBalesPulp: totalBalesPulp + ' BALES',
                        totalUnitsPulp: totalUnitsPulp + ' UNITS',
                        item: filteredItems,
                    }
                    : null; // Return null for empty containers
            })
            .filter(Boolean); // Remove all null values (empty containers)


        var boxCoverResult3D = allContainersBoxCover.map(function (containerWrapper, containerIndex) {
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
            var pcs = [];

            for (var i = 0; i < container.length; i++) {

                var netWeight = container[i].netWeight.toFixed(3);
                var netWeightKG = container[i].netWeight.toFixed(3) * 1000;
                var weight = container[i].grossWeight.toFixed(3);
                var weightKG = container[i].grossWeight.toFixed(3) * 1000;
                var pallets = container[i].palletsPerContainer;
                var product = container[i].product;
                
                if (!uniqueParent[product]) { // Check if weight is already added
                    containerNetWeight.push(netWeight);
                    containerNetWeightKG.push(netWeightKG);
                    containerGrossWeight.push(weight);
                    containerGrossWeightKG.push(weightKG);
                    noOfPallets.push(pallets);
                    palletsPerLayer.push(container[i].palletsPerLayer);
                    pcs.push(container[i].pcsPerContainer);
                    totalPalletsBoxCover += container[i].palletsPerContainer || 0;
                    totalPcsBoxCover += container[i].pcsPerContainer || 0;

                    uniqueParent[product] = true; // Mark as added
                    recommendedItems = container[i].recommendedItems;
                }
            }

            return {
                containerIndex: containerIndex + 1, 
                type: 'box and cover',
                layersUsed: layerCountForContainer + 1,
                palletsPerLayer: palletsPerLayer,
                palletsPerContainer: noOfPallets,
                width: binBoxCover.width,        
                height: binBoxCover.height,      
                length: binBoxCover.length,      
                containerNetWeight: containerNetWeight,
                containerNetWeightKG: containerNetWeightKG,
                containerGrossWeight: containerGrossWeight,
                containerGrossWeightKG: containerGrossWeightKG,
                pcs: pcs,

                recommendedItems: recommendedItems && recommendedItems.length > 0
                    ? recommendedItems.map(function (item) {
                        return {
                            name: item.name,
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
        var boxCoverResultConcal = allContainersBoxCover
            .map(function (containerWrapper, containerIndex) {
                var containerList = containerWrapper.containerListBoxCover;

                var filteredItems = containerList
                    .filter(function (packedBox) {
                        if (!uniqueItems.has(packedBox.internalId)) {
                            uniqueItems.add(packedBox.internalId);
                            return true;
                        }
                        return false;
                    })
                    .map(function (packedBox) {

                        packedBox.pcsPerContainer = packedBox.pcsPerContainer || 0;
                        packedBox.palletsPerContainer = packedBox.palletsPerContainer || 0;
                        packedBox.palletsPerLayer = packedBox.palletsPerLayer || 0;

                        return {
                            product: packedBox.product,
                            internalId: packedBox.internalId,
                            displayName: packedBox.displayName,
                            type: packedBox.type,
                            layer: packedBox.layer,
                            netWeight: packedBox.netWeight.toFixed(3),
                            netWeightKG: (packedBox.netWeight * 1000).toFixed(3),
                            grossWeight: packedBox.grossWeight.toFixed(3),
                            grossWeightKG: (packedBox.grossWeight * 1000).toFixed(3),
                            pcs: packedBox.pcsPerContainer + ' PC',
                            palletsPerContainer: packedBox.palletsPerContainer + ' PAL',
                            palletsPerLayer: packedBox.palletsPerLayer + ' PAL',
                            productLayer: packedBox.productLayer,
                            price: 0.0
                        };
                    });

                if (!containerIncrementedBoxCover) {
                    containerNo = containerNo + 1;
                    containerIncrementedBoxCover = true;
                }

                totalPalletsBoxCover = totalPalletsBoxCover || 0;
                totalPcsBoxCover = totalPcsBoxCover || 0;

                return filteredItems.length > 0 // Only return containers with items
                    ? {
                        containerIndex: containerNo,
                        containerSize: binBoxCover,
                        totalPalletsBoxCover: totalPalletsBoxCover + ' PAL',
                        totalPcsBoxCover: totalPcsBoxCover + ' PC',
                        item: filteredItems,
                    }
                    : null; // Return null for empty containers
            })
            .filter(Boolean); // Remove all null values (empty containers)

        var danResult3D = allContainersDAN.map(function (containerWrapper, containerIndex) {
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
            var packs = [];
            var totalBoxesPerContainer = 0;

            for (var i = 0; i < container.length; i++) {

                var netWeight = container[i].netWeight.toFixed(3);
                var netWeightKG = container[i].netWeight.toFixed(3) * 1000;
                var weight = container[i].grossWeight.toFixed(3);
                var weightKG = container[i].grossWeight.toFixed(3) * 1000;
                var pallets = container[i].palletsPerContainer;
                var product = container[i].product;
                
                if (!uniqueParent[product]) { // Check if weight is already added
                    containerNetWeight.push(netWeight);
                    containerNetWeightKG.push(netWeightKG);
                    containerGrossWeight.push(weight);
                    containerGrossWeightKG.push(weightKG);
                    noOfPallets.push(pallets);
                    palletsPerLayer.push(container[i].palletsPerLayer);
                    reams.push(container[i].reamsPerContainer);
                    boxes.push(container[i].boxesPerContainer);
                    packs.push(container[i].packsPerContainer);
                    totalReamsDAN += container[i].reamsPerContainer || 0;
                    totalBoxesPerContainer += container[i].boxesPerContainer;
                    totalPalletsDAN += container[i].palletsPerContainer || 0;
                    totalPacksDAN += container[i].packsPerContainer || 0;

                    uniqueParent[product] = true; // Mark as added
                    recommendedItems = container[i].recommendedItems;
                }
            }

            totalBoxesDAN = totalBoxesPerContainer || 0;
            return {
                containerIndex: containerIndex + 1, 
                type: 'doubla a notebook',
                layersUsed: layerCountForContainer + 1,
                palletsPerLayer: palletsPerLayer,
                palletsPerContainer: noOfPallets,
                width: binDAN.width,        
                height: binDAN.height,      
                length: binDAN.length,      
                containerNetWeight: containerNetWeight,
                containerNetWeightKG: containerNetWeightKG,
                containerGrossWeight: containerGrossWeight,
                containerGrossWeightKG: containerGrossWeightKG,
                reams: reams,
                boxes: boxes,
                each: packs,

                recommendedItems: recommendedItems && recommendedItems.length > 0
                    ? recommendedItems.map(function (item) {
                        return {
                            name: item.name,
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
        var danResultConcal = allContainersDAN
            .map(function (containerWrapper, containerIndex) {
                var containerList = containerWrapper.containerListDAN;

                var filteredItems = containerList
                    .filter(function (packedBox) {
                        if (!uniqueItems.has(packedBox.internalId)) {
                            uniqueItems.add(packedBox.internalId);
                            return true;
                        }
                        return false;
                    })
                    .map(function (packedBox) {
                        
                        packedBox.packsPerContainer = packedBox.packsPerContainer || 0;
                        packedBox.palletsPerContainer = packedBox.palletsPerContainer || 0;
                        packedBox.palletsPerLayer = packedBox.palletsPerLayer || 0;

                        return {
                            product: packedBox.product,
                            internalId: packedBox.internalId,
                            displayName: packedBox.displayName,
                            type: packedBox.type,
                            layer: packedBox.layer,
                            netWeight: packedBox.netWeight.toFixed(3),
                            netWeightKG: (packedBox.netWeight * 1000).toFixed(3),
                            grossWeight: packedBox.grossWeight.toFixed(3),
                            grossWeightKG: (packedBox.grossWeight * 1000).toFixed(3),
                            each: packedBox.packsPerContainer + ' EA',
                            palletsPerContainer: packedBox.palletsPerContainer + ' PAL',
                            palletsPerLayer: packedBox.palletsPerLayer + ' PAL',
                            productLayer: packedBox.productLayer,
                            price: 0.0
                        };
                    });

                if (!containerIncrementedDAN) {
                    containerNo = containerNo + 1;
                    containerIncrementedDAN = true;
                }

                totalPalletsDAN = totalPalletsDAN || 0;
                totalPacksDAN = totalPacksDAN || 0;

                return filteredItems.length > 0 // Only return containers with items
                    ? {
                        containerIndex: containerNo,
                        containerSize: binDAN,
                        totalPalletsDAN: totalPalletsDAN + ' PAL',
                        totalEachDAN: totalPacksDAN + ' EA',
                        item: filteredItems,
                    }
                    : null; // Return null for empty containers
            })
            .filter(Boolean); // Remove all null values (empty containers)
            
        var daosResult3D = allContainersDAOS.map(function (containerWrapper, containerIndex) {
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
            var totalBoxesPerContainer = 0;

            for (var i = 0; i < container.length; i++) {

                var netWeight = container[i].netWeight.toFixed(3);
                var netWeightKG = container[i].netWeight.toFixed(3) * 1000;
                var weight = container[i].grossWeight.toFixed(3);
                var weightKG = container[i].grossWeight.toFixed(3) * 1000;
                var pallets = container[i].palletsPerContainer;
                var product = container[i].product;
                
                if (!uniqueParent[product]) { // Check if weight is already added
                    containerNetWeight.push(netWeight);
                    containerNetWeightKG.push(netWeightKG);
                    containerGrossWeight.push(weight);
                    containerGrossWeightKG.push(weightKG);
                    noOfPallets.push(pallets);
                    palletsPerLayer.push(container[i].palletsPerLayer);
                    reams.push(container[i].reamsPerContainer);
                    boxes.push(container[i].boxesPerContainer);
                    totalReamsDAOS += container[i].reamsPerContainer || 0;
                    totalBoxesPerContainer += container[i].boxesPerContainer;
                    totalPalletsDAOS += container[i].palletsPerContainer || 0;

                    uniqueParent[product] = true; // Mark as added
                    recommendedItems = container[i].recommendedItems;
                }
            }

            totalBoxesDAOS = totalBoxesPerContainer || 0;
            return {
                containerIndex: containerIndex + 1, 
                type: 'double a office supply',
                layersUsed: layerCountForContainer + 1,
                palletsPerLayer: palletsPerLayer,
                palletsPerContainer: noOfPallets,
                width: binDAOS.width,        
                height: binDAOS.height,      
                length: binDAOS.length,      
                containerNetWeight: containerNetWeight,
                containerNetWeightKG: containerNetWeightKG,
                containerGrossWeight: containerGrossWeight,
                containerGrossWeightKG: containerGrossWeightKG,
                reams: reams,
                boxes: boxes,

                recommendedItems: recommendedItems && recommendedItems.length > 0
                    ? recommendedItems.map(function (item) {
                        return {
                            name: item.name,
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
        var daosResultConcal = allContainersDAOS
            .map(function (containerWrapper, containerIndex) {
                var containerList = containerWrapper.containerListDAOS;

                var filteredItems = containerList
                    .filter(function (packedBox) {
                        if (!uniqueItems.has(packedBox.internalId)) {
                            uniqueItems.add(packedBox.internalId);
                            return true;
                        }
                        return false;
                    })
                    .map(function (packedBox) {

                        packedBox.boxesPerContainer = packedBox.boxesPerContainer || 0;
                        packedBox.palletsPerContainer = packedBox.palletsPerContainer || 0;
                        packedBox.palletsPerLayer = packedBox.palletsPerLayer || 0;

                        return {
                            product: packedBox.product,
                            internalId: packedBox.internalId,
                            displayName: packedBox.displayName,
                            type: packedBox.type,
                            layer: packedBox.layer,
                            netWeight: packedBox.netWeight.toFixed(3),
                            netWeightKG: (packedBox.netWeight * 1000).toFixed(3),
                            grossWeight: packedBox.grossWeight.toFixed(3),
                            grossWeightKG: (packedBox.grossWeight * 1000).toFixed(3),
                            boxes: packedBox.boxesPerContainer + '  CAR',
                            palletsPerContainer: packedBox.palletsPerContainer + ' PAL',
                            palletsPerLayer: packedBox.palletsPerLayer + ' PAL',
                            productLayer: packedBox.productLayer,
                            price: 0.0
                        };
                    });

                if (!containerIncrementedDAOS) {
                    containerNo = containerNo + 1;
                    containerIncrementedDAOS = true;
                }

                totalPalletsDAOS = totalPalletsDAOS || 0;
                totalBoxesDAOS = totalBoxesDAOS || 0;

                return filteredItems.length > 0 // Only return containers with items
                    ? {
                        containerIndex: containerNo,
                        containerSize: binDAOS,
                        totalPalletsDAOS: totalPalletsDAOS + ' PAL',
                        totalBoxesDAOS: totalBoxesDAOS + ' CAR',
                        item: filteredItems,
                    }
                    : null; // Return null for empty containers
            })
            .filter(Boolean); // Remove all null values (empty containers)

        var dacpResult3D = allContainersDACP.map(function (containerWrapper, containerIndex) {
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
                    totalPalletsDACP += container[i].palletsPerContainer || 0;

                    uniqueParent[product] = true; // Mark as added
                }
                recommendedItems = container[i].recommendedItems;
                sortedRecommendedItems = container[i].sortedRecommendedItems;
                minOccupiedHeight = container[i].minOccupiedHeight;
            }

            totalReamsDACP = totalReamsPerContainer;
            totalBoxesDACP = totalBoxesPerContainer;
            layerCountForContainer += 1;

            return {
                containerIndex: containerIndex + 1, 
                type: 'double a colour paper',
                layersUsed: layerCountForContainer,
                palletsPerLayer: palletsPerLayer,
                palletsPerContainer: noOfPallets,
                width: binDACP.width,        // Bin width for DACP
                height: binDACP.height,      // Bin height for DACP
                length: binDACP.length,      // Bin length for DACP
                containerNetWeight: containerNetWeight,
                containerNetWeightKG: containerNetWeightKG,
                containerGrossWeight: containerGrossWeight,
                containerGrossWeightKG: containerGrossWeightKG,
                reams: reams,
                boxes: boxes,
                totalReamsPerContainer: totalReamsDACP,
                totalBoxesPerContainer: totalBoxesDACP,

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
                sortedRecommendedItems: sortedRecommendedItems,

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
        var dacpResultConcal = allContainersDACP
            .map(function (containerWrapper, containerIndex) {
                var containerList = containerWrapper.containerListDACP;

                var filteredItems = containerList
                    .filter(function (packedBox) {
                        if (!uniqueItems.has(packedBox.internalId)) {
                            uniqueItems.add(packedBox.internalId);
                            return true;
                        }
                        return false;
                    })
                    .map(function (packedBox) {

                        packedBox.boxesPerContainer = packedBox.boxesPerContainer || 0;
                        packedBox.palletsPerContainer = packedBox.palletsPerContainer || 0;
                        packedBox.palletsPerLayer = packedBox.palletsPerLayer || 0;

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
                            boxes: packedBox.boxesPerContainer + ' CAR',
                            palletsPerContainer: packedBox.palletsPerContainer + ' PAL',
                            palletsPerLayer: packedBox.palletsPerLayer + ' PAL',
                            productLayer: packedBox.productLayer,
                            price: 0.0 // Match folioResultConcal structure
                        };
                    });

            
                if (!containerIncrementedDACP) {
                    containerNo = containerNo + 1;
                    containerIncrementedDACP = true;
                }

                totalBoxesDACP = totalBoxesDACP || 0;
                totalPalletsDACP = totalPalletsDACP || 0;

                return filteredItems.length > 0 // Only return containers with items
                    ? {
                        containerIndex: containerNo,
                        containerSize: binDACP,
                        totalBoxesDACP: totalBoxesDACP + ' CAR',
                        totalPalletsDACP: totalPalletsDACP + ' PAL',
                        item: filteredItems,
                    }
                    : null; // Return null for empty containers
            })
            .filter(Boolean); // Remove all null values (empty containers)
    
        var cmSheetResult3D = allContainersCMSheet.map(function (containerWrapper, containerIndex) {
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
            var packs = [];
            var totalBoxesPerContainer = 0;

            for (var i = 0; i < container.length; i++) {

                var netWeight = container[i].netWeight.toFixed(3);
                var netWeightKG = container[i].netWeight.toFixed(3) * 1000;
                var weight = container[i].grossWeight.toFixed(3);
                var weightKG = container[i].grossWeight.toFixed(3) * 1000;
                var pallets = container[i].palletsPerContainer;
                var product = container[i].product;
                
                if (!uniqueParent[product]) { // Check if weight is already added
                    containerNetWeight.push(netWeight);
                    containerNetWeightKG.push(netWeightKG);
                    containerGrossWeight.push(weight);
                    containerGrossWeightKG.push(weightKG);
                    noOfPallets.push(pallets);
                    palletsPerLayer.push(container[i].palletsPerLayer);
                    reams.push(container[i].reamsPerContainer);
                    boxes.push(container[i].boxesPerContainer);
                    packs.push(container[i].packsPerContainer);
                    totalReamsCMSheet += container[i].reamsPerContainer;
                    totalBoxesPerContainer += container[i].boxesPerContainer;
                    totalPalletsCMSheet += container[i].palletsPerContainer || 0;
                    totalPacksCMSheet += container[i].packsPerContainer || 0;

                    uniqueParent[product] = true; // Mark as added
                    recommendedItems = container[i].recommendedItems;
                }
            }

            totalBoxesCMSheet = totalBoxesPerContainer || 0;
            return {
                containerIndex: containerIndex + 1, 
                type: 'CM Sheet',
                layersUsed: layerCountForContainer + 1,
                palletsPerLayer: palletsPerLayer,
                palletsPerContainer: noOfPallets,
                width: binCMSheet.width,        
                height: binCMSheet.height,      
                length: binCMSheet.length,      
                containerNetWeight: containerNetWeight,
                containerNetWeightKG: containerNetWeightKG,
                containerGrossWeight: containerGrossWeight,
                containerGrossWeightKG: containerGrossWeightKG,
                reams: reams,
                boxes: boxes,
                packs: packs,

                recommendedItems: recommendedItems && recommendedItems.length > 0
                    ? recommendedItems.map(function (item) {
                        return {
                            name: item.name,
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
        var cmSheetResultConcal = allContainersCMSheet
            .map(function (containerWrapper, containerIndex) {
                var containerList = containerWrapper.containerListCMSheet;

                var filteredItems = containerList
                    .filter(function (packedBox) {
                        if (!uniqueItems.has(packedBox.internalId)) {
                            uniqueItems.add(packedBox.internalId);
                            return true;
                        }
                        return false;
                    })
                    .map(function (packedBox) {

                        packedBox.reamsPerContainer = packedBox.reamsPerContainer || 0;
                        packedBox.boxesPerContainer = packedBox.boxesPerContainer || 0;
                        packedBox.packsPerContainer = packedBox.packsPerContainer || 0;
                        packedBox.palletsPerContainer = packedBox.palletsPerContainer || 0;
                        packedBox.palletsPerLayer = packedBox.palletsPerLayer || 0;

                        return {
                            product: packedBox.product,
                            internalId: packedBox.internalId,
                            displayName: packedBox.displayName,
                            type: packedBox.type,
                            layer: packedBox.layer,
                            netWeight: packedBox.netWeight.toFixed(3),
                            netWeightKG: (packedBox.netWeight * 1000).toFixed(3),
                            grossWeight: packedBox.grossWeight.toFixed(3),
                            grossWeightKG: (packedBox.grossWeight * 1000).toFixed(3),
                            reams: packedBox.reamsPerContainer + ' RM',
                            boxes: packedBox.boxesPerContainer + ' CAR',
                            packs: packedBox.packsPerContainer + ' PACK',
                            palletsPerContainer: packedBox.palletsPerContainer + ' PAL',
                            palletsPerLayer: packedBox.palletsPerLayer + ' PAL',
                            productLayer: packedBox.productLayer,
                            price: 0.0
                        };
                    });

                if (!containerIncrementedCMSheet) {
                    containerNo = containerNo + 1;
                    containerIncrementedCMSheet = true;
                }
                
                totalReamsCMSheet = totalReamsCMSheet || 0;
                totalBoxesCMSheet = totalBoxesCMSheet || 0;
                totalPalletsCMSheet = totalPalletsCMSheet || 0;
                totalPacksCMSheet = totalPacksCMSheet || 0;

                return filteredItems.length > 0 // Only return containers with items
                    ? {
                        containerIndex: containerNo,
                        containerSize: binCMSheet,
                        totalReamsCMSheet: totalReamsCMSheet + ' RM',
                        totalBoxesCMSheet: totalBoxesCMSheet + ' CAR',
                        totalPalletsCMSheet: totalPalletsCMSheet + ' PAL',
                        totalPacksCMSheet: totalPacksCMSheet + ' PACK',
                        item: filteredItems,
                    }
                    : null; // Return null for empty containers
            })
            .filter(Boolean); // Remove all null values (empty containers)

        var wrapperResult3D = wrapperResults.map(function (containerWrapper, containerIndex) {
            var container = containerWrapper.packedBoxes; // Access packedBoxes directly

            var uniqueParent = {}; 
            var containerNetWeight = [];
            var containerNetWeightKG = [];
            var containerGrossWeight = [];
            var containerGrossWeightKG = [];
            var wrappersPerLayer = []; 
            var reams = []; 
            var boxes = [];
            var totalReamsPerContainer = 0;
            var totalBoxesPerContainer = 0;

            for (var i = 0; i < container.length; i++) {
                var netWeight = container[i].netWeight.toFixed(3);
                var netWeightKG = (container[i].netWeight * 1000).toFixed(3);
                var grossWeight = container[i].grossWeight.toFixed(3);
                var grossWeightKG = (container[i].grossWeight * 1000).toFixed(3);
                var wrappersPerContainer = container[i].wrappersPerContainer;
        
                for (var j = 0; j < container[i].item.length; j++) {

                    var product = container[i].item[j].product;
                    
                    if (!uniqueParent[product]) { // Check if weight is already added
                        containerNetWeight.push(netWeight);
                        containerNetWeightKG.push(netWeightKG);
                        containerGrossWeight.push(grossWeight);
                        containerGrossWeightKG.push(grossWeightKG);
                        finalWrappersPerContainer.push(wrappersPerContainer);
                        wrappersPerLayer.push(container[i].wrappersPerLayer);
                        reams.push(container[i].reamsPerContainer);
                        boxes.push(container[i].boxesPerContainer);

                        uniqueParent[product] = true; // Mark as added
                    }

                    recommendedItems = container[i].recommendedItems;

                }

            }

            if (finalWrappersPerContainer && finalWrappersPerContainer.length > 0) {
                totalRollsWrapper = finalWrappersPerContainer.reduce(function(sum, value) {
                    return sum + value;
                }, 0);
            }
            
            return {
                containerIndex: containerIndex + 1,
                type: 'wrapper',
                layersUsed: container.length > 0 ? container[0].layersUsed : 1,
                rollsPerLayer: wrappersPerLayer,
                rollsPerContainer: finalWrappersPerContainer,
                width: binWrapper.width,        
                height: binWrapper.height,      
                length: binWrapper.length,      
                containerNetWeight: containerNetWeight,
                containerNetWeightKG: containerNetWeightKG,
                containerGrossWeight: containerGrossWeight,
                containerGrossWeightKG: containerGrossWeightKG,
                
                recommendedItems: recommendedItems && recommendedItems.length > 0
                    ? recommendedItems.map(function (item) {
                        return {
                            name: item.name,
                            maxQuantity: item.maxQuantity,
                            width: item.width.toFixed(2),
                            diameter: item.diameter.toFixed(2),
                            weight: item.weight,
                        };
                    })
                    : null,
        
                item: (function () {
                    var allItems = [];
                    for (var i = 0; i < container.length; i++) {
                        if (container[i].item && Array.isArray(container[i].item)) {
                            allItems = allItems.concat(container[i].item);
                        }
                    }
                    return allItems;
                })()
            };
        });
        var wrapperResultConcal = allContainersWrapper.map(function (containerWrapper, containerIndex) {
            var container = containerWrapper.packedBoxes; // Access packedBoxes directly
            var containerList = containerWrapper.containerListWrapper;
        
            // Calculate the total weight and grand total for the container
            var containerGrandTotal = 0.0;
            
            if (!containerIncrementedWrapper) {
                containerNo = containerNo + 1;
                containerIncrementedWrapper = true;
            }

            return {
                containerIndex: containerNo,
                containerSize: binWrapper,
                totalRollsWrapper: totalRollsWrapper + ' ROL',
                item: containerList.map(function (packedBox) {
                    
                    packedBox.wrappersPerContainer = packedBox.wrappersPerContainer || 0;
                    packedBox.wrappersPerLayer = packedBox.wrappersPerLayer || 0;

                    return {
                        product: packedBox.product,
                        internalId: packedBox.internalId,
                        displayName: packedBox.displayName,
                        type: packedBox.type,
                        netWeight: packedBox.netWeight.toFixed(3),
                        netWeightKG: packedBox.netWeight.toFixed(3) * 1000,
                        grossWeight: packedBox.grossWeight.toFixed(3),
                        grossWeightKG: packedBox.grossWeight.toFixed(3) * 1000,
                        wrappersPerContainer: packedBox.wrappersPerContainer + ' ROL',
                        wrappersPerLayer: packedBox.wrappersPerLayer + ' ROL',
                        price: containerGrandTotal,
                    };
                }),
            };
        });
        
        var rollResult3D = rollResults.map(function (containerWrapper, containerIndex) {
            var container = containerWrapper.packedBoxes; // Access packedBoxes directly

            var uniqueParent = {}; 
            var containerNetWeight = [];
            var containerNetWeightKG = [];
            var containerGrossWeight = [];
            var containerGrossWeightKG = [];
            var rollsPerLayer = []; 
            var reams = []; 
            var boxes = [];
            var totalReamsPerContainer = 0;
            var totalBoxesPerContainer = 0;

            for (var i = 0; i < container.length; i++) {
                var netWeight = container[i].netWeight.toFixed(3);
                var netWeightKG = (container[i].netWeight * 1000).toFixed(3);
                var grossWeight = container[i].grossWeight.toFixed(3);
                var grossWeightKG = (container[i].grossWeight * 1000).toFixed(3);
                var rollsPerContainer = container[i].rollsPerContainer;
        
                for (var j = 0; j < container[i].item.length; j++) {

                    var product = container[i].item[j].product;
                    
                    if (!uniqueParent[product]) { // Check if weight is already added
                        containerNetWeight.push(netWeight);
                        containerNetWeightKG.push(netWeightKG);
                        containerGrossWeight.push(grossWeight);
                        containerGrossWeightKG.push(grossWeightKG);
                        finalrollsPerContainer.push(rollsPerContainer);
                        rollsPerLayer.push(container[i].rollsPerLayer);
                        reams.push(container[i].reamsPerContainer);
                        boxes.push(container[i].boxesPerContainer);

                        uniqueParent[product] = true; // Mark as added
                    }

                    recommendedItems = container[i].recommendedItems;

                }

            }

            if (finalrollsPerContainer && finalrollsPerContainer.length > 0) {
                totalPalletsRoll = finalrollsPerContainer.reduce(function(sum, value) {
                    return sum + value;
                }, 0);
            }
            
            return {
                containerIndex: containerIndex + 1,
                type: 'Roll',
                layersUsed: container.length > 0 ? container[0].layersUsed : 1,
                rollsPerLayer: rollsPerLayer,
                rollsPerContainer: finalrollsPerContainer,
                width: binRoll.width,        
                height: binRoll.height,      
                length: binRoll.length,      
                containerNetWeight: containerNetWeight,
                containerNetWeightKG: containerNetWeightKG,
                containerGrossWeight: containerGrossWeight,
                containerGrossWeightKG: containerGrossWeightKG,
                
                recommendedItems: recommendedItems && recommendedItems.length > 0
                    ? recommendedItems.map(function (item) {
                        return {
                            name: item.name,
                            maxQuantity: item.maxQuantity,
                            width: item.width.toFixed(2),
                            diameter: item.diameter.toFixed(2),
                            weight: item.weight,
                        };
                    })
                    : null,
        
                item: (function () {
                    var allItems = [];
                    for (var i = 0; i < container.length; i++) {
                        if (container[i].item && Array.isArray(container[i].item)) {
                            allItems = allItems.concat(container[i].item);
                        }
                    }
                    return allItems;
                })()
            };
        });

        var rollResultConcal = allContainersRoll.map(function (containerWrapper, containerIndex) {
            var container = containerWrapper.packedBoxes; // Access packedBoxes directly
            var containerList = containerWrapper.containerListRoll;
        
            // Calculate the total weight and grand total for the container
            var containerGrandTotal = 0.0;
            
            // if (!containerIncrementedRoll) {
                containerNo = containerNo + 1;
                // containerIncrementedRoll = true;
            // }

            log.debug('containerList', containerList);
            log.debug('containerList.length', containerList.length);
            log.debug('containerNo', containerNo);
            return {
                containerIndex: containerNo,
                containerSize: binRoll,
                totalPalletsRoll: totalPalletsRoll + ' ROL',
                item: containerList.map(function (packedBox) {

                    packedBox.rollsPerContainer = packedBox.rollsPerContainer || 0;
                    packedBox.rollsPerLayer = packedBox.rollsPerLayer || 0;

                    return {
                        product: packedBox.product,
                        internalId: packedBox.internalId,
                        displayName: packedBox.displayName,
                        type: packedBox.type,
                        netWeight: packedBox.netWeight.toFixed(3),
                        netWeightKG: packedBox.netWeight.toFixed(3) * 1000,
                        grossWeight: packedBox.grossWeight.toFixed(3),
                        grossWeightKG: packedBox.grossWeight.toFixed(3) * 1000,
                        rollsPerContainer: packedBox.rollsPerContainer + ' ROL',
                        rollsPerLayer: packedBox.rollsPerLayer + ' ROL',
                        price: containerGrandTotal,
                    };
                }),
            };
        });

        var cmRollResult3D = cmRollResults.map(function (containerWrapper, containerIndex) {
            var container = containerWrapper.packedBoxes; // Access packedBoxes directly

            var uniqueParent = {}; 
            var containerNetWeight = [];
            var containerNetWeightKG = [];
            var containerGrossWeight = [];
            var containerGrossWeightKG = [];
            var cmRollsPerLayer = []; 
            var reams = []; 
            var boxes = [];
            var totalReamsPerContainer = 0;
            var totalBoxesPerContainer = 0;

            for (var i = 0; i < container.length; i++) {
                var netWeight = container[i].netWeight.toFixed(3);
                var netWeightKG = (container[i].netWeight * 1000).toFixed(3);
                var grossWeight = container[i].grossWeight.toFixed(3);
                var grossWeightKG = (container[i].grossWeight * 1000).toFixed(3);
                var cmRollsPerContainer = container[i].cmRollsPerContainer;
        
                for (var j = 0; j < container[i].item.length; j++) {

                    var product = container[i].item[j].product;
                    
                    if (!uniqueParent[product]) { // Check if weight is already added
                        containerNetWeight.push(netWeight);
                        containerNetWeightKG.push(netWeightKG);
                        containerGrossWeight.push(grossWeight);
                        containerGrossWeightKG.push(grossWeightKG);
                        finalCMRollsPerContainer.push(cmRollsPerContainer);
                        cmRollsPerLayer.push(container[i].cmRollsPerLayer);
                        reams.push(container[i].reamsPerContainer);
                        boxes.push(container[i].boxesPerContainer);

                        uniqueParent[product] = true; // Mark as added
                    }

                    recommendedItems = container[i].recommendedItems;

                }

            }

            if (finalCMRollsPerContainer && finalCMRollsPerContainer.length > 0) {
                totalPalletsCMRoll = finalCMRollsPerContainer.reduce(function(sum, value) {
                    return sum + value;
                }, 0);
            }
            
            return {
                containerIndex: containerIndex + 1,
                type: 'CM Roll',
                layersUsed: container.length > 0 ? container[0].layersUsed : 1,
                cmRollsPerLayer: cmRollsPerLayer,
                cmRollsPerContainer: finalCMRollsPerContainer,
                width: binCMRoll.width,        
                height: binCMRoll.height,      
                length: binCMRoll.length,      
                containerNetWeight: containerNetWeight,
                containerNetWeightKG: containerNetWeightKG,
                containerGrossWeight: containerGrossWeight,
                containerGrossWeightKG: containerGrossWeightKG,
                
                recommendedItems: recommendedItems && recommendedItems.length > 0
                    ? recommendedItems.map(function (item) {
                        return {
                            name: item.name,
                            maxQuantity: item.maxQuantity,
                            width: item.width.toFixed(2),
                            diameter: item.diameter.toFixed(2),
                            weight: item.weight,
                        };
                    })
                    : null,
        
                item: (function () {
                    var allItems = [];
                    for (var i = 0; i < container.length; i++) {
                        if (container[i].item && Array.isArray(container[i].item)) {
                            allItems = allItems.concat(container[i].item);
                        }
                    }
                    return allItems;
                })()
            };
        });
        var cmRollResultConcal = allContainersCMRoll.map(function (containerWrapper, containerIndex) {
            var container = containerWrapper.packedBoxes; // Access packedBoxes directly
            var containerList = containerWrapper.containerListCMRoll;
        
            // Calculate the total weight and grand total for the container
            var containerGrandTotal = 0.0;
            
            if (!containerIncrementedCMRoll) {
                containerNo = containerNo + 1;
                containerIncrementedCMRoll = true;
            }

            return {
                containerIndex: containerNo,
                containerSize: binCMRoll,
                totalPalletsCMRoll: totalPalletsCMRoll + ' ROL',
                item: containerList.map(function (packedBox) {
                    
                    packedBox.cmRollsPerContainer = packedBox.cmRollsPerContainer || 0;
                    packedBox.cmRollsPerLayer = packedBox.cmRollsPerLayer || 0;

                    return {
                        product: packedBox.product,
                        internalId: packedBox.internalId,
                        displayName: packedBox.displayName,
                        type: packedBox.type,
                        netWeight: packedBox.netWeight.toFixed(3),
                        netWeightKG: packedBox.netWeight.toFixed(3) * 1000,
                        grossWeight: packedBox.grossWeight.toFixed(3),
                        grossWeightKG: packedBox.grossWeight.toFixed(3) * 1000,
                        cmRollsPerContainer: packedBox.cmRollsPerContainer + ' ROL',
                        cmRollsPerLayer: packedBox.cmRollsPerLayer + ' ROL',
                        price: containerGrandTotal,
                    };
                }),
            };
        });

        var combinedResults3D= [];
        var combinedResultsConcal= [];

        // combine mixed
        for (var i = 0; i < mixedResult3D.length; i++) {
            combinedResults3D.push(mixedResult3D[i]);
        }

        for (var i = 0; i < mixedResultConcal.length; i++) {
            combinedResultsConcal.push(mixedResultConcal[i]);
        }

        // combine cutsize
        for (var i = 0; i < cutsizeResult3D.length; i++) {
            combinedResults3D.push(cutsizeResult3D[i]);
        }

        for (var i = 0; i < cutsizeResultConcal.length; i++) {
            combinedResultsConcal.push(cutsizeResultConcal[i]);
        }

        // combine folio
        for (var i = 0; i < folioResult3D.length; i++) {
            combinedResults3D.push(folioResult3D[i]);
        }
        for (var i = 0; i < folioResultConcal.length; i++) {
            combinedResultsConcal.push(folioResultConcal[i]);
        }

        // combine honeycomb
        for (var i = 0; i < honeycombResult3D.length; i++) {
            combinedResults3D.push(honeycombResult3D[i]);
        }
        for (var i = 0; i < honeycombResultConcal.length; i++) {
            combinedResultsConcal.push(honeycombResultConcal[i]);
        }

        // combine pulp
        for (var i = 0; i < pulpResult3D.length; i++) {
            combinedResults3D.push(pulpResult3D[i]);
        }
        for (var i = 0; i < pulpResultConcal.length; i++) {
            combinedResultsConcal.push(pulpResultConcal[i]);
        }

        // combine box and cover
        for (var i = 0; i < boxCoverResult3D.length; i++) {
            combinedResults3D.push(boxCoverResult3D[i]);
        }
        for (var i = 0; i < boxCoverResultConcal.length; i++) {
            combinedResultsConcal.push(boxCoverResultConcal[i]);
        }

        // combine DAN
        for (var i = 0; i < danResult3D.length; i++) {
            combinedResults3D.push(danResult3D[i]);
        }
        for (var i = 0; i < danResultConcal.length; i++) {
            combinedResultsConcal.push(danResultConcal[i]);
        }

        // combine DAOS
        for (var i = 0; i < daosResult3D.length; i++) {
            combinedResults3D.push(daosResult3D[i]);
        }
        for (var i = 0; i < daosResultConcal.length; i++) {
            combinedResultsConcal.push(daosResultConcal[i]);
        }

        // combine DACP
        for (var i = 0; i < dacpResult3D.length; i++) {
            combinedResults3D.push(dacpResult3D[i]);
        }

        for (var i = 0; i < dacpResultConcal.length; i++) {
            combinedResultsConcal.push(dacpResultConcal[i]);
        }

        // combine cm sheet
        for (var i = 0; i < cmSheetResult3D.length; i++) {
            combinedResults3D.push(cmSheetResult3D[i]);
        }
        for (var i = 0; i < cmSheetResultConcal.length; i++) {
            combinedResultsConcal.push(cmSheetResultConcal[i]);
        }

        // combine wrapper
        for (var i = 0; i < wrapperResult3D.length; i++) {
            combinedResults3D.push(wrapperResult3D[i]);
        }
        for (var i = 0; i < wrapperResultConcal.length; i++) {
            combinedResultsConcal.push(wrapperResultConcal[i]);
        }

        // combine roll
        for (var i = 0; i < rollResult3D.length; i++) {
            combinedResults3D.push(rollResult3D[i]);
        }
        for (var i = 0; i < rollResultConcal.length; i++) {
            combinedResultsConcal.push(rollResultConcal[i]);
        }

        // combine CM roll
        for (var i = 0; i < cmRollResult3D.length; i++) {
            combinedResults3D.push(cmRollResult3D[i]);
        }
        for (var i = 0; i < cmRollResultConcal.length; i++) {
            combinedResultsConcal.push(cmRollResultConcal[i]);
        }
        
        var transformed = {
            containers: [],
        };

        if (!parsedBody.selectedOption || parsedBody.selectedOption.length === 0) {
            transformed.recommendedItems = recommendedBestFitItems;  
        } else {
            transformed.selectedOption = parsedBody.selectedOption;

            if (parsedBody.selectedStatus === "adjustedQty"){

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
        
                if (nonNullCount === 0){
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
        var jsonResult3D = JSON.stringify(combinedResults3D, null, 4); 
        var jsonResultConcal = JSON.stringify(transformed, null, 4); 

        try {

            var parsed = JSON.parse(context.request.body);
            if (parsed.action == 'viewContainerList'){
                context.response.setHeader({
                    name: 'Content-Type',
                    value: 'application/json'
                });
                
                context.response.setHeader({
                    name: 'Content-Disposition',
                    value: 'inline; filename="result.json"'
                });
                
                context.response.write({
                    output: jsonResultConcal
                });
            } else if(parsed.action == 'view3D'){
                context.response.write({
                    output: jsonResult3D
                });
            }

            // Save data into file cabinet
            var fileObj3D = file.create({
                    name: '3D_input_ftn.json',
                    fileType: file.Type.JSON,
                    contents: jsonResult3D,
                    folder: 12262
                });
            fileId3D = fileObj3D.save();
            
            var fileObjConcal = file.create({
                name: 'ConCal_input_ftn.json',
                fileType: file.Type.JSON,
                contents: jsonResultConcal,
                folder: 17979
            });
            var fileIdConcal = fileObjConcal.save();
            log.debug('File Saved', 'File ID 3D Input: ' + fileId3D);
            log.debug('File Saved', 'File ID Concal Input: ' + fileIdConcal);
            
        } catch (e) {
            log.error('Error Sending Data to Suitelet', e);
            throw e;
        }
    } 
}























