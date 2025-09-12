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

var error, file, record, runtime, search, cache, serverWidget, redirect, https, libCode, url, log;

var SUITESCRIPT_ID = "";
var CLIENTSCRIPT_ID = "";

var MODULE = new Array();
MODULE.push('N/error');
MODULE.push('N/file');
MODULE.push('N/record');
MODULE.push('N/runtime');
MODULE.push('N/search');
MODULE.push('N/cache');
MODULE.push('N/ui/serverWidget');
MODULE.push('N/redirect');
MODULE.push('N/https');
MODULE.push('SuiteScripts/Lib/Libraries Code 2.0.220622.js');
MODULE.push('N/url');
MODULE.push('N/log');

define(MODULE,
/**
 * @param {error} _error
 * @param {file} _file
 * @param {record} _record
 * @param {runtime} _runtime
 * @param {search} _search
 * @param {cache} _cache
 * @param {serverWidget} _serverWidget
 * @param {redirect} _redirect
 * @param {https} _https
 * @param {libCode_220622} _libCode
 * @param {url} _url
 * @param {log} _log
 */
function(_error, _file, _record, _runtime, _search, _cache, _serverWidget, _redirect, _https, _libCode, _url, _log) {
	error = _error;
	file = _file;
	record = _record;
	runtime = _runtime;
	search = _search;
	cache = _cache;
	serverWidget = _serverWidget;
	redirect = _redirect;
	https = _https;
	libCode = _libCode;
	url = _url;
	log = _log;

	return {
		onRequest : OnRequest
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
function OnRequest(context) {
    // ==================== Define Default Variable
    var request = context.request;
    var response = context.response;
    // ============================================

    // POST = SCA
    // GET = TEST ON NS
    if (request.method === 'POST') {
        
        var freeGifts = {};
        var selectedOption = [];
        var boxesCutsize = {};
        var boxesFolio = {};
        var boxesRoll = {};
        var boxesCMSheet = {};
        var boxesCMRoll = {};
        var boxesHoneycomb = {};
        var boxesPulp = {};
        var boxesBoxCover = {};
        var boxesWrapper = {};
        var boxesDAOS = {};
        var boxesDAN = {};
        var boxesDACP = {};
        var boxesMixed = {};
        var jsonDataCutsize = null;
        var jsonDataFolio = null;
        var jsonDataRoll = null;
        var jsonDataCMSheet = null;
        var jsonDataCMRoll = null;
        var jsonDataHoneycomb = null;
        var jsonDataPulp = null;
        var jsonDataBoxCover = null;
        var jsonDataWrapper = null;
        var jsonDataDAOS = null;
        var jsonDataDAN = null;
        var jsonDataDACP = null;

        log.debug('request.body', request);
        var jsonData = JSON.parse(request.body);
        var jsonCustomer = jsonData.customer_id;

        if (jsonData.items) {

            var mixed = false;
            var firstProductType = null;
            var productTypeID = null;
            var itemId = null;
            var itemType = null;

            for (var i = 0; i < jsonData.items.length; i++) {

                itemId = jsonData.items[i].custpage_product.id;

                itemType = search.lookupFields({
                    type: 'item',
                    id: itemId,
                    columns: ['recordtype']
                }).recordtype;

                productTypeID = record.load({
                    type: itemType,
                    id: itemId
                }).getValue('custitem_infor_sca_itemsubtype');

                if (i === 0) {
                    firstProductType = productTypeID;
                } else if (productTypeID !== firstProductType) {
                    mixed = true;
                    break;
                }
            }

            for (var i = 0; i < jsonData.items.length; i++) {

                var itemId = jsonData.items[i].custpage_product.id;
                var qtyUOM = jsonData.items[i].custpage_quantityuom.text;
                var containerId = jsonData.items[i].custpage_container.id;
                var maxPallets = 0;

                if (qtyUOM === 'EA'){
                    qtyUOM = 'box';
                } else if(qtyUOM === 'MT'){
                    qtyUOM = 'ton'
                }

                // First, get the item type using search.lookupFields
                var itemType = search.lookupFields({
                    type: 'item',
                    id: itemId,
                    columns: ['recordtype']
                }).recordtype;

                // Now load the item using the retrieved type
                var productTypeID = record.load({
                    type: itemType,
                    id: itemId
                }).getValue('custitem_infor_sca_itemsubtype');

                var productTypeName = null
                if (productTypeID){
                    var productTypeName = record.load({
                        type: 'customrecord_sca_itemsubtype_mappinglist',
                        id: productTypeID
                    }).getValue('name');
                }
                
                var displayName = record.load({
                    type: itemType,
                    id: itemId
                }).getValue('displayname');
                
                // Load Customer
                var customerRec = record.load({
                    type: 'customer',
                    id: jsonCustomer
                }); 

                // Load Pallet by Customer details
                var containerPalletByCustomerSearch = search.create({
                    type: 'customrecord_container_pallet_by_cust',
                    filters: [
                        ['custrecord_customer', 'is', jsonCustomer]
                    ],
                    columns: ['custrecord_country', 'custrecord_pallet_type', 'custrecord_tolerance']
                });
                var containerPalletResults = containerPalletByCustomerSearch.run().getRange({ start: 0, end: 1 }) || [];
                var customerPallet = 'null';
                if (containerPalletResults.length > 0) {
                    customerPallet = containerPalletResults[0].getValue('custrecord_pallet_type');
                    customerPallet = customerPallet ? customerPallet.split(',') : [];
                    tolerance = containerPalletResults[0].getValue('custrecord_tolerance');
                }

                // var specialConditionSearch = search.create({
                //     type: 'customrecord_special_condition',
                //     filters: [
                //         ['custrecord_criteria_salechannel', 'anyof', customerRec.getValue('cseg_sale_channel')], 'AND',
                //         ['custrecord_criteria_shiptocountry', 'anyof', customerRec.getValue('custentity_ship_to_country')], 'AND',
                //         ['custrecord_criteria_distributionchannel', 'anyof', customerRec.getValue('cseg_dist_chanl')], 'AND',
                //         ['custrecord_criteria_containersize', 'anyof', containerId], 'AND',
                //         ['custrecord_criteria_pallettype', 'anyof', customerPallet]
                //     ],                            
                //     columns: ['custrecord_title', 'custrecord_criteria_shiptocountry', 'custrecord_criteria_pallettype', 'custrecord_criteria_scaitemsubtype', 'custrecord_criteria_gram', 'custrecord_criteria_papersize', 
                //                 'custrecord_criteria_layer', 'custrecord_criteria_reamsperpallet', 'custrecord_criteria_sheet', 'custrecord_guideline_pallettype', 'custrecord_guideline_minnetweight',
                //                 'custrecord_guideline_maxpallets', 'custrecord_guideline_maxlayers', 'custrecord_guideline_position', 'custrecord_guideline_condition']
                // });
                
                // var specialConditionResult = specialConditionSearch.run().getRange({
                //     start: 0,
                //     end: 200
                // }) || [];

                // Load Special Condition
                var scFilters = [
                    ['custrecord_criteria_salechannel', 'anyof', customerRec.getValue('cseg_sale_channel')], 'AND',
                    ['custrecord_criteria_shiptocountry', 'anyof', customerRec.getValue('custentity_ship_to_country')], 'AND',
                    ['custrecord_criteria_distributionchannel', 'anyof', customerRec.getValue('cseg_dist_chanl')], 'AND',
                    ['custrecord_criteria_containersize', 'anyof', containerId]
                ];
                
                var specialConditionSearch = search.create({
                    type: 'customrecord_special_condition',
                    filters: scFilters,
                    columns: [
                        'custrecord_title',
                        'custrecord_criteria_shiptocountry',
                        'custrecord_criteria_pallettype',
                        'custrecord_criteria_scaitemsubtype',
                        'custrecord_criteria_gram',
                        'custrecord_criteria_papersize',
                        'custrecord_criteria_layer',
                        'custrecord_criteria_reamsperpallet',
                        'custrecord_criteria_sheet',
                        'custrecord_guideline_pallettype',
                        'custrecord_guideline_minnetweight',
                        'custrecord_guideline_maxpallets',
                        'custrecord_guideline_maxlayers',
                        'custrecord_guideline_position',
                        'custrecord_guideline_condition'
                    ]
                });
                
                var specialConditionResult = [];
                specialConditionSearch.run().each(function(result) {
                    var palletType = result.getValue('custrecord_criteria_pallettype'); 
                    var scaItemSubtype = result.getValue('custrecord_criteria_scaitemsubtype'); 

                    var palletAccept = true;
                    var subtypeAccept = true;
                    var palletChecked = false;
                    var subtypeChecked = false;

                    // 🔹 Check pallet type if exists
                    if (palletType) {
                        palletChecked = true;
                        var palletTypeArr = palletType.split(',').map(function(v) { return v.trim(); });
                        var customerPalletArr = Array.isArray(customerPallet) ? customerPallet : [customerPallet];
                        palletAccept = customerPalletArr.some(function(cp) {
                            return palletTypeArr.indexOf(cp) !== -1;
                        });
                    }

                    // 🔹 Check scaItemSubtype if exists
                    if (scaItemSubtype) {
                        subtypeChecked = true;
                        var scaItemSubtypeArr = scaItemSubtype.split(',').map(function(v) { return v.trim(); });
                        var productTypeIDArr = Array.isArray(productTypeID) ? productTypeID : [productTypeID];
                        subtypeAccept = productTypeIDArr.some(function(pt) {
                            return scaItemSubtypeArr.indexOf(pt) !== -1;
                        });
                    }

                    // 🔹 Final decision
                    var accept = false;
                    if (palletChecked && subtypeChecked) {
                        // both exist → must pass both
                        accept = palletAccept && subtypeAccept;
                    } else if (palletChecked) {
                        // only pallet exists
                        accept = palletAccept;
                    } else if (subtypeChecked) {
                        // only subtype exists
                        accept = subtypeAccept;
                    } else {
                        // none exist → accept
                        accept = true;
                    }

                    if (accept) {
                        specialConditionResult.push(result);
                    }

                    return true;
                });

                var specialConditions = [];
                
                if (specialConditionResult && specialConditionResult.length > 0) {
                    specialConditionResult.forEach(function (rec) {

                        var scData = {
                            scTitle: rec.getValue('custrecord_title'),
                            scShiptocountry: rec.getValue('custrecord_criteria_shiptocountry'),
                        
                            // Always return array (split if string, wrap if single value)
                            scScaitemsubtype: rec.getValue('custrecord_criteria_scaitemsubtype')
                                ? rec.getValue('custrecord_criteria_scaitemsubtype').toString().split(',').map(function(v){ return v.trim(); })
                                : [],
                        
                            scGram: rec.getValue('custrecord_criteria_gram'),
                        
                            scPapersize: rec.getValue('custrecord_criteria_papersize')
                                ? rec.getValue('custrecord_criteria_papersize').toString().split(',').map(function(v){ return v.trim(); })
                                : [],
                        
                            scPallettype: rec.getValue('custrecord_criteria_pallettype'),
                        
                            scLayer: rec.getValue('custrecord_criteria_layer')
                                ? rec.getValue('custrecord_criteria_layer').toString().split(',').map(function(v){ return v.trim(); })
                                : [],
                        
                            scReamsperpallet: rec.getValue('custrecord_criteria_reamsperpallet'),
                            scSheet: rec.getValue('custrecord_criteria_sheet'),
                        
                            scMinNetWeight: rec.getValue('custrecord_guideline_minnetweight'),
                            scMaxPallets: rec.getValue('custrecord_guideline_maxpallets'),
                            scMaxLayers: rec.getValue('custrecord_guideline_maxlayers'),
                            scPosition: rec.getValue('custrecord_guideline_position'),
                            scCondition: rec.getValue('custrecord_guideline_condition')
                        };
                        
                
                        specialConditions.push(scData);
                    });
                }
                
                log.debug('Special Conditionsxxx', specialConditions);
                
                var filters = [
                    ['custitem_infor_pallet_type', 'anyof', customerPallet]
                ];
                
                if (specialConditions && specialConditions.length > 0) {
                    // Use Sets to prevent duplicates
                    var layerSet = new Set();
                    var paperSizeSet = new Set();
                    var subtypeSet = new Set();
                    var gramSet = new Set();
                
                    specialConditions.forEach(function(sc) {
                        if (sc.scLayer && sc.scLayer.length > 0) {
                            sc.scLayer.forEach(function(layer) {
                                layerSet.add(layer);
                            });
                        }
                
                        if (sc.scPapersize && sc.scPapersize.length > 0) {
                            sc.scPapersize.forEach(function(size) {
                                paperSizeSet.add(size);
                            });
                        }
                
                        if (sc.scScaitemsubtype && sc.scScaitemsubtype.length > 0) {
                            sc.scScaitemsubtype.forEach(function(subtype) {
                                subtypeSet.add(subtype);
                            });
                        }
                
                        if (sc.scGram) {
                            gramSet.add(sc.scGram);
                        }
                
                        if (sc.scMaxPallets) {
                            maxPallets = sc.scMaxPallets;
                        }
                    });
                
                    // Build filters only if sets have values
                    if (layerSet.size > 0) {
                        filters.push('AND');
                        filters.push(['custitem_infor_layer', 'anyof', Array.from(layerSet)]);
                    }
                
                    if (paperSizeSet.size > 0) {
                        filters.push('AND');
                        filters.push(['custitem_infor_paper_size', 'anyof', Array.from(paperSizeSet)]);
                    }
                
                    if (subtypeSet.size > 0) {
                        filters.push('AND');
                        filters.push(['custitem_infor_sca_itemsubtype', 'anyof', Array.from(subtypeSet)]);
                    }
                
                    if (gramSet.size > 0) {
                        filters.push('AND');
                        filters.push(['cseg_item_gram', 'anyof', Array.from(gramSet)]);
                    }
                }
                
                if (mixed === true) {

                    jsonDataMixed = jsonData.items;
                    var productId = jsonDataMixed[i].custpage_product.id;
                    var weight = jsonDataMixed[i].custpage_quantity;
                    var containerId = jsonDataMixed[i].custpage_container.id;

                    // Load container details
                    var containerRec = record.load({
                        type: 'customrecord_exp_containerssize',
                        id: containerId
                    }); 
                    
                    var binMixed = {
                        size: containerRec.getText('name') || null,
                        length: parseFloat(containerRec.getValue('custrecord_con_dimensionlength')) || 0,
                        width: parseFloat(containerRec.getValue('custrecord_con_dimensionwide')) || 0,
                        height: parseFloat(containerRec.getValue('custrecord_con_dimensionheight')) || 0,
                        maxWeight: parseFloat(containerRec.getValue('custrecord_con_maxweight'))/1000 || 0
                    };
                    
                    // Load item details
                    var itemType = search.lookupFields({
                        type: search.Type.ITEM,
                        id: productId,
                        columns: ['recordtype']
                    }).recordtype;

                    var itemRecord = record.load({ type: itemType, id: productId });
                    var parent = itemRecord.getValue({ fieldId: 'displayname' });
                
                    if (productTypeName && productTypeName.toLowerCase().includes('copy paper')){
                        filters.push('AND', ['parent', 'is', productId]);
                        log.debug('filters2', filters);
                        var itemSearch = search.create({
                            type: itemType,
                            filters: filters,
                            columns: [
                                'internalid',
                                'custitem_infor_layer',
                                'custitem_infor_pallet_type',
                                'displayname',
                                'itemid',
                                'unitstype',
                                'custitem_infor_pallet_wide_inch',
                                'custitem_infor_pallet_length_inch',
                                'custitem_infor_pallet_height_inch',
                                'custitem_infor_std_net_weight',
                                'custitem_infor_gross_weight'
                            ]
                        });
                    } else {
                        var itemSearch = search.create({
                            type: itemType,
                            filters: [['internalid', 'anyof', productId]],
                            columns: [
                                'internalid', 'displayname', 'itemid', 'unitstype',
                                'custitem_infor_pallet_wide_inch', 'custitem_infor_pallet_length_inch',
                                'custitem_infor_pallet_height_inch', 'custitem_infor_std_net_weight',
                                'custitem_infor_gross_weight', 'custitem_infor_layer',
                            ]
                        });
                    }

                    var searchResult = itemSearch.run().getRange({ start: 0, end: 1000 }) || [];
                
                    if (searchResult.length > 0) {
                        searchResult.forEach(function (result) {
                            var unitTypeId = result.getValue({ name: 'unitstype' });
                            var uomConversionRates = {};
                            var baseUnitAbbreviation = '';
                
                            if (unitTypeId) {
                                var unitTypeRecord = record.load({ type: record.Type.UNITS_TYPE, id: unitTypeId });
                                var lineCount = unitTypeRecord.getLineCount({ sublistId: 'uom' });
                
                                for (var j = 0; j < lineCount; j++) {
                                    var abbreviation = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'abbreviation', line: j });
                                    var baseUnit = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'baseunit', line: j });
                                    var conversionRate = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'conversionrate', line: j });
                
                                    if (abbreviation) {
                                        abbreviation = abbreviation.toLowerCase();
                                        uomConversionRates[abbreviation] = parseFloat(conversionRate) || 1;
                                    }
    
                                    if (baseUnit === true) { // Fix for base unit check
                                        baseUnitAbbreviation = abbreviation;
                                    }
                                }
                            }
                
                            var itemData = {
                                documentNo: 'A0108224Z',
                                type: productTypeName,
                                mixed: true,
                                unitstype: result.getText({ name: 'unitstype' }),
                                product: result.getValue({ name: 'itemid' }),
                                internalId: result.getValue({ name: 'internalid' }),
                                displayName: result.getValue({ name: 'displayname' }),
                                pallet: (parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0) > 0 &&
                                        parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0) > 0) ? 'true' : 'false',
                                layer: result.getText({ name: 'custitem_infor_layer' }) || 'N/A',
                                length: parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0),
                                width: parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0),
                                height: parseFloat(result.getValue({ name: 'custitem_infor_pallet_height_inch' }) || 0),
                                weight: parseFloat(weight || 0),
                                netWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_std_net_weight' }) || 0),
                                grossWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_gross_weight' }) || 0),
                                maxWeightTon: weight, // Capture from JSON
                                baseUnitAbbreviation: qtyUOM || baseUnitAbbreviation,
                                binMixed: binMixed,
                                uomConversionRates: uomConversionRates,

                            };
                
                            var parentKey = parent + " - " + weight + baseUnitAbbreviation;
                            if (!boxesMixed[parentKey]) {
                                boxesMixed[parentKey] = [];
                            }
                            boxesMixed[parentKey].push(itemData);
                        });
                    }
                } else {
                    if (productTypeName && productTypeName.toLowerCase().includes('copy paper')) {

                        jsonDataCutsize = jsonData.items;
                        var productId = jsonDataCutsize[i].custpage_product.id;
                        var weight = jsonDataCutsize[i].custpage_quantity;
                        var containerId = jsonDataCutsize[i].custpage_container.id;
    
                        // Load container details
                        var containerRec = record.load({
                            type: 'customrecord_exp_containerssize',
                            id: containerId
                        }); 
                        
                        var binCutsize = {
                            size: containerRec.getText('name') || null,
                            length: parseFloat(containerRec.getValue('custrecord_con_dimensionlength')) || 0,
                            width: parseFloat(containerRec.getValue('custrecord_con_dimensionwide')) || 0,
                            height: parseFloat(containerRec.getValue('custrecord_con_dimensionheight')) || 0,
                            maxWeight: maxPallets || 0
                        };
                        
                        // Load item details
                        var itemType = search.lookupFields({
                            type: search.Type.ITEM,
                            id: productId,
                            columns: ['recordtype']
                        }).recordtype;
    
                        var itemRecord = record.load({ type: itemType, id: productId });
                        var parent = itemRecord.getValue({ fieldId: 'displayname' });
                    
                        filters.push('AND', ['parent', 'is', productId]);
                        var itemSearch = search.create({
                            type: itemType,
                            filters: filters,
                            columns: [
                                'internalid',
                                'custitem_infor_layer',
                                'custitem_infor_pallet_type',
                                'displayname',
                                'itemid',
                                'unitstype',
                                'custitem_infor_pallet_wide_inch',
                                'custitem_infor_pallet_length_inch',
                                'custitem_infor_pallet_height_inch',
                                'custitem_infor_std_net_weight',
                                'custitem_infor_gross_weight'
                            ]
                        });
                        var searchResult = itemSearch.run().getRange({ start: 0, end: 1000 }) || [];
                    
                        log.debug('searchresult', searchResult);
                        if (searchResult.length > 0) {
                            searchResult.forEach(function (result) {
                                var unitTypeId = result.getValue({ name: 'unitstype' });
                                var uomConversionRates = {};
                                var baseUnitAbbreviation = '';
                    
                                if (unitTypeId) {
                                    var unitTypeRecord = record.load({ type: record.Type.UNITS_TYPE, id: unitTypeId });
                                    var lineCount = unitTypeRecord.getLineCount({ sublistId: 'uom' });
                    
                                    for (var j = 0; j < lineCount; j++) {
                                        var abbreviation = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'abbreviation', line: j });
                                        var baseUnit = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'baseunit', line: j });
                                        var conversionRate = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'conversionrate', line: j });
                    
                                        if (abbreviation) {
                                            abbreviation = abbreviation.toLowerCase();
                                            uomConversionRates[abbreviation] = parseFloat(conversionRate) || 1;
                                        }
        
                                        if (baseUnit === true) { // Fix for base unit check
                                            baseUnitAbbreviation = abbreviation;
                                        }
                                    }
                                }
                    
                                var itemData = {
                                    documentNo: 'A0108224Z',
                                    type: 'cutsize',
                                    parentID: productId,
                                    parentName: parent,
                                    unitstype: result.getText({ name: 'unitstype' }),
                                    product: result.getValue({ name: 'itemid' }),
                                    internalId: result.getValue({ name: 'internalid' }),
                                    displayName: result.getValue({ name: 'displayname' }),
                                    pallet: (parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0) > 0 &&
                                            parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0) > 0) ? 'true' : 'false',
                                    layer: result.getText({ name: 'custitem_infor_layer' }) || 'N/A',
                                    length: parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0),
                                    width: parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0),
                                    height: parseFloat(result.getValue({ name: 'custitem_infor_pallet_height_inch' }) || 0),
                                    weight: parseFloat(weight || 0),
                                    netWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_std_net_weight' }) || 0),
                                    grossWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_gross_weight' }) || 0),
                                    maxWeightTon: weight, // Capture from JSON
                                    baseUnitAbbreviation: qtyUOM || baseUnitAbbreviation,
                                    binCutsize: binCutsize,
                                    uomConversionRates: uomConversionRates,
                                    tolerance: tolerance
    
                                };
                    
                                var parentKey = parent + " - " + weight + baseUnitAbbreviation;
                                if (!boxesCutsize[parentKey]) {
                                    boxesCutsize[parentKey] = [];
                                }
                                boxesCutsize[parentKey].push(itemData);
                            });
                        }
                    }  
                    
                    if (productTypeName && (productTypeName.toLowerCase().includes('ream wrap on pallet (rop)') || productTypeName.toLowerCase().includes('bulk pack on pallet (bpop)'))) {
                        
                        jsonDataFolio = jsonData.items;
                        var productId = jsonDataFolio[i].custpage_product.id;
                        var weight = jsonDataFolio[i].custpage_quantity;
                        var containerId = jsonDataFolio[i].custpage_container.id;
    
                        // Load container details
                        var containerRec = record.load({
                            type: 'customrecord_exp_containerssize',
                            id: containerId
                        }); 
                        
                        var binFolio = {
                            size: containerRec.getText('name') || null,
                            length: parseFloat(containerRec.getValue('custrecord_con_dimensionlength')) || 0,
                            width: parseFloat(containerRec.getValue('custrecord_con_dimensionwide')) || 0,
                            height: parseFloat(containerRec.getValue('custrecord_con_dimensionheight')) || 0,
                            maxWeight: parseFloat(containerRec.getValue('custrecord_con_maxweight'))/1000 || 0
                        };
    
                        // Load item details
                        var itemType = search.lookupFields({
                            type: search.Type.ITEM,
                            id: productId,
                            columns: ['recordtype']
                        }).recordtype;
    
                        var itemRecord = record.load({ type: itemType, id: productId });
                        var parent = itemRecord.getValue({ fieldId: 'displayname' });
    
                        var itemSearch = search.create({
                            type: itemType,
                            filters: [
                                ['internalid', 'anyof', productId],
                                'AND',
                                ['custitem_infor_pallet_type', 'anyof', customerPallet]
                            ],
                            columns: [
                                'internalid', 'displayname', 'itemid', 'unitstype',
                                'custitem_infor_pallet_wide_inch', 'custitem_infor_pallet_length_inch',
                                'custitem_infor_pallet_height_inch', 'custitem_infor_std_net_weight',
                                'custitem_infor_gross_weight', 'custitem_infor_layer'
                            ]
                        });
    
                        var searchResult = itemSearch.run().getRange({ start: 0, end: 1000 }) || [];

                        if (searchResult.length > 0) {
                            searchResult.forEach(function (result) {
                                var unitTypeId = result.getValue({ name: 'unitstype' });
                                var uomConversionRates = {};
                                var baseUnitAbbreviation = '';
    
                                if (unitTypeId) {
                                    var unitTypeRecord = record.load({ type: record.Type.UNITS_TYPE, id: unitTypeId });
                                    var lineCount = unitTypeRecord.getLineCount({ sublistId: 'uom' });
    
                                    for (var j = 0; j < lineCount; j++) {
                                        var abbreviation = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'abbreviation', line: j });
                                        var baseUnit = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'baseunit', line: j });
                                        var conversionRate = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'conversionrate', line: j });
    
                                        if (abbreviation) {
                                            abbreviation = abbreviation.toLowerCase();
                                            uomConversionRates[abbreviation] = parseFloat(conversionRate) || 1;
                                        }
    
                                        if (baseUnit === true) { // Fix for base unit check
                                            baseUnitAbbreviation = abbreviation;
                                        }
                                    }
                                }
    
                                var itemData = {
                                    documentNo: 'T1259523F',
                                    type: 'folio',
                                    unitstype: result.getText({ name: 'unitstype' }),
                                    product: result.getValue({ name: 'itemid' }),
                                    internalId: result.getValue({ name: 'internalid' }),
                                    displayName: result.getValue({ name: 'displayname' }),
                                    pallet: (parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0) > 0 &&
                                            parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0) > 0) ? 'true' : 'false',
                                    layer: result.getText({ name: 'custitem_infor_layer' }) || 'N/A',
                                    length: parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0),
                                    width: parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0),
                                    height: parseFloat(result.getValue({ name: 'custitem_infor_pallet_height_inch' }) || 0),
                                    weight: parseFloat(weight || 0),
                                    netWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_std_net_weight' }) || 0),
                                    grossWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_gross_weight' }) || 0),
                                    maxWeightTon: weight, // Capture from JSON
                                    baseUnitAbbreviation: qtyUOM || baseUnitAbbreviation,
                                    binFolio: binFolio,
                                    uomConversionRates: uomConversionRates
                                };
    
                                var parentKey = parent + " - " + weight + baseUnitAbbreviation;
                                if (!boxesFolio[parentKey]) {
                                    boxesFolio[parentKey] = [];
                                }
                                boxesFolio[parentKey].push(itemData);
                            });
                        }
                        log.debug('boxesfolio', boxesFolio);
    
                    }   
    
                    if (productTypeName && productTypeName.toLowerCase().includes('honeycomb')) {
    
                        jsonDataHoneycomb = jsonData.items;
                        var productId = jsonDataHoneycomb[i].custpage_product.id;
                        var weight = jsonDataHoneycomb[i].custpage_quantity;
                        var containerId = jsonDataHoneycomb[i].custpage_container.id;
    
                        // Load container details
                        var containerRec = record.load({
                            type: 'customrecord_exp_containerssize',
                            id: containerId
                        }); 
                        
                        var binHoneycomb = {
                            size: containerRec.getText('name') || null,
                            length: parseFloat(containerRec.getValue('custrecord_con_dimensionlength')) || 0,
                            width: parseFloat(containerRec.getValue('custrecord_con_dimensionwide')) || 0,
                            height: parseFloat(containerRec.getValue('custrecord_con_dimensionheight')) || 0,
                            maxWeight: parseFloat(containerRec.getValue('custrecord_con_maxweight'))/1000 || 0
                        };
    
                        // Load item details
                        var itemType = search.lookupFields({
                            type: search.Type.ITEM,
                            id: productId,
                            columns: ['recordtype']
                        }).recordtype;
    
                        var itemRecord = record.load({ type: itemType, id: productId });
                        var parent = itemRecord.getValue({ fieldId: 'displayname' });
    
                        var itemSearch = search.create({
                            type: itemType,
                            filters: [
                                ['internalid', 'anyof', productId],
                                'AND',
                                ['custitem_infor_pallet_type', 'anyof', customerPallet]
                            ],
                            columns: [
                                'internalid', 'displayname', 'itemid', 'unitstype',
                                'custitem_infor_pallet_wide_inch', 'custitem_infor_pallet_length_inch',
                                'custitem_infor_pallet_height_inch', 'custitem_infor_std_net_weight',
                                'custitem_infor_gross_weight', 'custitem_infor_layer'
                            ]
                        });
    
                        var searchResult = itemSearch.run().getRange({ start: 0, end: 1000 }) || [];
    
                        if (searchResult.length > 0) {
                            searchResult.forEach(function (result) {
                                var unitTypeId = result.getValue({ name: 'unitstype' });
                                var uomConversionRates = {};
                                var baseUnitAbbreviation = '';
    
                                if (unitTypeId) {
                                    var unitTypeRecord = record.load({ type: record.Type.UNITS_TYPE, id: unitTypeId });
                                    var lineCount = unitTypeRecord.getLineCount({ sublistId: 'uom' });
    
                                    for (var j = 0; j < lineCount; j++) {
                                        var abbreviation = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'abbreviation', line: j });
                                        var baseUnit = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'baseunit', line: j });
                                        var conversionRate = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'conversionrate', line: j });
    
                                        if (abbreviation) {
                                            abbreviation = abbreviation.toLowerCase();
                                            uomConversionRates[abbreviation] = parseFloat(conversionRate) || 1;
                                        }
    
                                        if (baseUnit === true) { // Fix for base unit check
                                            baseUnitAbbreviation = abbreviation;
                                        }
                                    }
                                }
    
                                var itemData = {
                                    documentNo: 'T1259523F',
                                    type: 'honeycomb',
                                    unitstype: result.getText({ name: 'unitstype' }),
                                    product: result.getValue({ name: 'itemid' }),
                                    internalId: result.getValue({ name: 'internalid' }),
                                    displayName: result.getValue({ name: 'displayname' }),
                                    pallet: (parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0) > 0 &&
                                            parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0) > 0) ? 'true' : 'false',
                                    layer: result.getText({ name: 'custitem_infor_layer' }) || 'N/A',
                                    length: parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0),
                                    width: parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0),
                                    height: parseFloat(result.getValue({ name: 'custitem_infor_pallet_height_inch' }) || 0),
                                    weight: parseFloat(weight || 0),
                                    netWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_std_net_weight' }) || 0),
                                    grossWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_gross_weight' }) || 0),
                                    maxWeightTon: weight, // Capture from JSON
                                    baseUnitAbbreviation: qtyUOM || baseUnitAbbreviation,
                                    binHoneycomb: binHoneycomb,
                                    uomConversionRates: uomConversionRates
                                };
    
                                var parentKey = parent + " - " + weight + baseUnitAbbreviation;
                                if (!boxesHoneycomb[parentKey]) {
                                    boxesHoneycomb[parentKey] = [];
                                }
                                boxesHoneycomb[parentKey].push(itemData);
                            });
                        }
                        log.debug('boxesHoneycomb', boxesHoneycomb);
    
                    }   
    
                    if (productTypeName && productTypeName.toLowerCase().includes('pulp')) {
    
                        jsonDataPulp = jsonData.items;
                        var productId = jsonDataPulp[i].custpage_product.id;
                        var weight = jsonDataPulp[i].custpage_quantity;
                        var containerId = jsonDataPulp[i].custpage_container.id;
    
                        // Load container details
                        var containerRec = record.load({
                            type: 'customrecord_exp_containerssize',
                            id: containerId
                        }); 
                        
                        var binPulp = {
                            size: containerRec.getText('name') || null,
                            length: parseFloat(containerRec.getValue('custrecord_con_dimensionlength')) || 0,
                            width: parseFloat(containerRec.getValue('custrecord_con_dimensionwide')) || 0,
                            height: parseFloat(containerRec.getValue('custrecord_con_dimensionheight')) || 0,
                            maxWeight: parseFloat(containerRec.getValue('custrecord_con_maxweight'))/1000 || 0
                        };
    
                        // Load item details
                        var itemType = search.lookupFields({
                            type: search.Type.ITEM,
                            id: productId,
                            columns: ['recordtype']
                        }).recordtype;
    
                        var itemRecord = record.load({ type: itemType, id: productId });
                        var parent = itemRecord.getValue({ fieldId: 'displayname' });
    
                        var itemSearch = search.create({
                            type: itemType,
                            filters: ['internalid', 'anyof', productId],
                            columns: [
                                'internalid', 'displayname', 'itemid', 'unitstype',
                                'custitem_infor_pallet_wide_inch', 'custitem_infor_pallet_length_inch',
                                'custitem_infor_pallet_height_inch', 'custitem_infor_std_net_weight',
                                'custitem_infor_gross_weight', 'custitem_infor_layer', 'custitem_infor_wide_inch', 'custitem_infor_length_inch'
                            ]
                        });
    
                        var searchResult = itemSearch.run().getRange({ start: 0, end: 1000 }) || [];
    
                        if (searchResult.length > 0) {
                            searchResult.forEach(function (result) {
                                var unitTypeId = result.getValue({ name: 'unitstype' });
                                var uomConversionRates = {};
                                var baseUnitAbbreviation = '';
    
                                if (unitTypeId) {
                                    var unitTypeRecord = record.load({ type: record.Type.UNITS_TYPE, id: unitTypeId });
                                    var lineCount = unitTypeRecord.getLineCount({ sublistId: 'uom' });
    
                                    for (var j = 0; j < lineCount; j++) {
                                        var abbreviation = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'abbreviation', line: j });
                                        var baseUnit = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'baseunit', line: j });
                                        var conversionRate = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'conversionrate', line: j });
    
                                        if (abbreviation) {
                                            abbreviation = abbreviation.toLowerCase();
                                            uomConversionRates[abbreviation] = parseFloat(conversionRate) || 1;
                                        }
    
                                        if (baseUnit === true) { // Fix for base unit check
                                            baseUnitAbbreviation = abbreviation;
                                        }
                                    }
                                }
    
                                log.debug('custitem_infor_wide_inch', parseFloat(result.getValue({ name: 'custitem_infor_wide_inch' })));
                                var itemData = {
                                    documentNo: 'T1259523F',
                                    type: 'pulp',
                                    unitstype: result.getText({ name: 'unitstype' }),
                                    product: result.getValue({ name: 'itemid' }),
                                    internalId: result.getValue({ name: 'internalid' }),
                                    displayName: result.getValue({ name: 'displayname' }),
                                    pallet: (parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0) > 0 &&
                                            parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0) > 0) ? 'true' : 'false',
                                    layer: result.getText({ name: 'custitem_infor_layer' }) || 'N/A',
                                    length: parseFloat(result.getValue({ name: 'custitem_infor_length_inch' }) || 0),
                                    width: parseFloat(result.getValue({ name: 'custitem_infor_wide_inch' }) || 0),
                                    height: parseFloat(result.getValue({ name: 'custitem_infor_pallet_height_inch' }) || 0),
                                    weight: parseFloat(weight || 0),
                                    netWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_std_net_weight' }) || 0),
                                    grossWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_gross_weight' }) || 0),
                                    maxWeightTon: weight, // Capture from JSON
                                    baseUnitAbbreviation: qtyUOM || baseUnitAbbreviation,
                                    binPulp: binPulp,
                                    uomConversionRates: uomConversionRates
                                };
    
                                var parentKey = parent + " - " + weight + baseUnitAbbreviation;
                                if (!boxesPulp[parentKey]) {
                                    boxesPulp[parentKey] = [];
                                }
                                boxesPulp[parentKey].push(itemData);
                            });
                        }
                        log.debug('boxesPulp', boxesPulp);
    
                    } 
    
                    if (productTypeName && productTypeName.toLowerCase().includes('box and cover')) {
    
                        jsonDataBoxCover = jsonData.items;
                        var productId = jsonDataBoxCover[i].custpage_product.id;
                        var weight = jsonDataBoxCover[i].custpage_quantity;
                        var containerId = jsonDataBoxCover[i].custpage_container.id;
    
                        // Load container details
                        var containerRec = record.load({
                            type: 'customrecord_exp_containerssize',
                            id: containerId
                        }); 
                        
                        var binBoxCover = {
                            size: containerRec.getText('name') || null,
                            length: parseFloat(containerRec.getValue('custrecord_con_dimensionlength')) || 0,
                            width: parseFloat(containerRec.getValue('custrecord_con_dimensionwide')) || 0,
                            height: parseFloat(containerRec.getValue('custrecord_con_dimensionheight')) || 0,
                            maxWeight: parseFloat(containerRec.getValue('custrecord_con_maxweight'))/1000 || 0
                        };
    
                        // Load item details
                        var itemType = search.lookupFields({
                            type: search.Type.ITEM,
                            id: productId,
                            columns: ['recordtype']
                        }).recordtype;
    
                        var itemRecord = record.load({ type: itemType, id: productId });
                        var parent = itemRecord.getValue({ fieldId: 'displayname' });
    
                        var itemSearch = search.create({
                            type: itemType,
                            filters: [
                                ['internalid', 'anyof', productId],
                                'AND',
                                ['custitem_infor_pallet_type', 'anyof', customerPallet]
                            ],
                            columns: [
                                'internalid', 'displayname', 'itemid', 'unitstype',
                                'custitem_infor_pallet_wide_inch', 'custitem_infor_pallet_length_inch',
                                'custitem_infor_pallet_height_inch', 'custitem_infor_std_net_weight',
                                'custitem_infor_gross_weight', 'custitem_infor_layer'
                            ]
                        });
    
                        var searchResult = itemSearch.run().getRange({ start: 0, end: 1000 }) || [];
    
                        if (searchResult.length > 0) {
                            searchResult.forEach(function (result) {
                                var unitTypeId = result.getValue({ name: 'unitstype' });
                                var uomConversionRates = {};
                                var baseUnitAbbreviation = '';
    
                                if (unitTypeId) {
                                    var unitTypeRecord = record.load({ type: record.Type.UNITS_TYPE, id: unitTypeId });
                                    var lineCount = unitTypeRecord.getLineCount({ sublistId: 'uom' });
    
                                    for (var j = 0; j < lineCount; j++) {
                                        var abbreviation = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'abbreviation', line: j });
                                        var baseUnit = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'baseunit', line: j });
                                        var conversionRate = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'conversionrate', line: j });
    
                                        if (abbreviation) {
                                            abbreviation = abbreviation.toLowerCase();
                                            uomConversionRates[abbreviation] = parseFloat(conversionRate) || 1;
                                        }
    
                                        if (baseUnit === true) { // Fix for base unit check
                                            baseUnitAbbreviation = abbreviation;
                                        }
                                    }
                                }
    
                                var itemData = {
                                    documentNo: 'T1259523F',
                                    type: 'box and cover',
                                    unitstype: result.getText({ name: 'unitstype' }),
                                    product: result.getValue({ name: 'itemid' }),
                                    internalId: result.getValue({ name: 'internalid' }),
                                    displayName: result.getValue({ name: 'displayname' }),
                                    pallet: (parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0) > 0 &&
                                            parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0) > 0) ? 'true' : 'false',
                                    layer: result.getText({ name: 'custitem_infor_layer' }) || 'N/A',
                                    length: parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0),
                                    width: parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0),
                                    height: parseFloat(result.getValue({ name: 'custitem_infor_pallet_height_inch' }) || 0),
                                    weight: parseFloat(weight || 0),
                                    netWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_std_net_weight' }) || 0),
                                    grossWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_gross_weight' }) || 0),
                                    maxWeightTon: weight, // Capture from JSON
                                    baseUnitAbbreviation: qtyUOM || baseUnitAbbreviation,
                                    binBoxCover: binBoxCover,
                                    uomConversionRates: uomConversionRates
                                };
    
                                var parentKey = parent + " - " + weight + baseUnitAbbreviation;
                                if (!boxesBoxCover[parentKey]) {
                                    boxesBoxCover[parentKey] = [];
                                }
                                boxesBoxCover[parentKey].push(itemData);
                            });
                        }
                        log.debug('boxesBoxCover', boxesBoxCover);
    
                    } 
                    
                    if (productTypeName && productTypeName.toLowerCase().includes('double a notebook')) {
    
                        jsonDataDAN = jsonData.items;
                        var productId = jsonDataDAN[i].custpage_product.id;
                        var weight = jsonDataDAN[i].custpage_quantity;
                        var containerId = jsonDataDAN[i].custpage_container.id;
    
                        // Load container details
                        var containerRec = record.load({
                            type: 'customrecord_exp_containerssize',
                            id: containerId
                        }); 
                        
                        var binDAN = {
                            size: containerRec.getText('name') || null,
                            length: parseFloat(containerRec.getValue('custrecord_con_dimensionlength')) || 0,
                            width: parseFloat(containerRec.getValue('custrecord_con_dimensionwide')) || 0,
                            height: parseFloat(containerRec.getValue('custrecord_con_dimensionheight')) || 0,
                            maxWeight: parseFloat(containerRec.getValue('custrecord_con_maxweight'))/1000 || 0
                        };
    
                        // Load item details
                        var itemType = search.lookupFields({
                            type: search.Type.ITEM,
                            id: productId,
                            columns: ['recordtype']
                        }).recordtype;
    
                        var itemRecord = record.load({ type: itemType, id: productId });
                        var parent = itemRecord.getValue({ fieldId: 'displayname' });
    
                        var itemSearch = search.create({
                            type: itemType,
                            filters: [
                                ['internalid', 'anyof', productId],
                                'AND',
                                ['custitem_infor_pallet_type', 'anyof', customerPallet]
                            ],
                            columns: [
                                'internalid', 'displayname', 'itemid', 'unitstype',
                                'custitem_infor_pallet_wide_inch', 'custitem_infor_pallet_length_inch',
                                'custitem_infor_pallet_height_inch', 'custitem_infor_std_net_weight',
                                'custitem_infor_gross_weight', 'custitem_infor_layer'
                            ]
                        });
    
                        var searchResult = itemSearch.run().getRange({ start: 0, end: 1000 }) || [];
    
                        if (searchResult.length > 0) {
                            searchResult.forEach(function (result) {
                                var unitTypeId = result.getValue({ name: 'unitstype' });
                                var uomConversionRates = {};
                                var baseUnitAbbreviation = '';
    
                                if (unitTypeId) {
                                    var unitTypeRecord = record.load({ type: record.Type.UNITS_TYPE, id: unitTypeId });
                                    var lineCount = unitTypeRecord.getLineCount({ sublistId: 'uom' });
    
                                    for (var j = 0; j < lineCount; j++) {
                                        var abbreviation = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'abbreviation', line: j });
                                        var baseUnit = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'baseunit', line: j });
                                        var conversionRate = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'conversionrate', line: j });
    
                                        if (abbreviation) {
                                            abbreviation = abbreviation.toLowerCase();
                                            uomConversionRates[abbreviation] = parseFloat(conversionRate) || 1;
                                        }
    
                                        if (baseUnit === true) { // Fix for base unit check
                                            baseUnitAbbreviation = abbreviation;
                                        }
                                    }
                                }
    
                                var itemData = {
                                    documentNo: 'T1259523F',
                                    type: 'double a notebook',
                                    unitstype: result.getText({ name: 'unitstype' }),
                                    product: result.getValue({ name: 'itemid' }),
                                    internalId: result.getValue({ name: 'internalid' }),
                                    displayName: result.getValue({ name: 'displayname' }),
                                    pallet: (parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0) > 0 &&
                                            parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0) > 0) ? 'true' : 'false',
                                    layer: result.getText({ name: 'custitem_infor_layer' }) || 'N/A',
                                    length: parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0),
                                    width: parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0),
                                    height: parseFloat(result.getValue({ name: 'custitem_infor_pallet_height_inch' }) || 0),
                                    weight: parseFloat(weight || 0),
                                    netWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_std_net_weight' }) || 0),
                                    grossWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_gross_weight' }) || 0),
                                    maxWeightTon: weight, // Capture from JSON
                                    baseUnitAbbreviation: qtyUOM || baseUnitAbbreviation,
                                    binDAN: binDAN,
                                    uomConversionRates: uomConversionRates
                                };
    
                                var parentKey = parent + " - " + weight + baseUnitAbbreviation;
                                if (!boxesDAN[parentKey]) {
                                    boxesDAN[parentKey] = [];
                                }
                                boxesDAN[parentKey].push(itemData);
                            });
                        }
                        log.debug('boxesDAN', boxesDAN);
    
                    } 
    
                    if (productTypeName && productTypeName.toLowerCase().includes('double a office supply')) {
    
                        jsonDataDAOS = jsonData.items;
                        var productId = jsonDataDAOS[i].custpage_product.id;
                        var weight = jsonDataDAOS[i].custpage_quantity;
                        var containerId = jsonDataDAOS[i].custpage_container.id;
    
                        // Load container details
                        var containerRec = record.load({
                            type: 'customrecord_exp_containerssize',
                            id: containerId
                        }); 
                        
                        var binDAOS = {
                            size: containerRec.getText('name') || null,
                            length: parseFloat(containerRec.getValue('custrecord_con_dimensionlength')) || 0,
                            width: parseFloat(containerRec.getValue('custrecord_con_dimensionwide')) || 0,
                            height: parseFloat(containerRec.getValue('custrecord_con_dimensionheight')) || 0,
                            maxWeight: parseFloat(containerRec.getValue('custrecord_con_maxweight'))/1000 || 0
                        };
    
                        // Load item details
                        var itemType = search.lookupFields({
                            type: search.Type.ITEM,
                            id: productId,
                            columns: ['recordtype']
                        }).recordtype;
    
                        var itemRecord = record.load({ type: itemType, id: productId });
                        var parent = itemRecord.getValue({ fieldId: 'displayname' });
    
                        var itemSearch = search.create({
                            type: itemType,
                            filters: [
                                ['internalid', 'anyof', productId],
                                'AND',
                                ['custitem_infor_pallet_type', 'anyof', customerPallet]
                            ],
                            columns: [
                                'internalid', 'displayname', 'itemid', 'unitstype',
                                'custitem_infor_pallet_wide_inch', 'custitem_infor_pallet_length_inch',
                                'custitem_infor_pallet_height_inch', 'custitem_infor_std_net_weight',
                                'custitem_infor_gross_weight', 'custitem_infor_layer'
                            ]
                        });
    
                        var searchResult = itemSearch.run().getRange({ start: 0, end: 1000 }) || [];
    
                        if (searchResult.length > 0) {
                            searchResult.forEach(function (result) {
                                var unitTypeId = result.getValue({ name: 'unitstype' });
                                var uomConversionRates = {};
                                var baseUnitAbbreviation = '';
    
                                if (unitTypeId) {
                                    var unitTypeRecord = record.load({ type: record.Type.UNITS_TYPE, id: unitTypeId });
                                    var lineCount = unitTypeRecord.getLineCount({ sublistId: 'uom' });
    
                                    for (var j = 0; j < lineCount; j++) {
                                        var abbreviation = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'abbreviation', line: j });
                                        var baseUnit = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'baseunit', line: j });
                                        var conversionRate = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'conversionrate', line: j });
    
                                        if (abbreviation) {
                                            abbreviation = abbreviation.toLowerCase();
                                            uomConversionRates[abbreviation] = parseFloat(conversionRate) || 1;
                                        }
    
                                        if (baseUnit === true) { // Fix for base unit check
                                            baseUnitAbbreviation = abbreviation;
                                        }
                                    }
                                }
    
                                var itemData = {
                                    documentNo: 'T1259523F',
                                    type: 'double a office supply',
                                    unitstype: result.getText({ name: 'unitstype' }),
                                    product: result.getValue({ name: 'itemid' }),
                                    internalId: result.getValue({ name: 'internalid' }),
                                    displayName: result.getValue({ name: 'displayname' }),
                                    pallet: (parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0) > 0 &&
                                            parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0) > 0) ? 'true' : 'false',
                                    layer: result.getText({ name: 'custitem_infor_layer' }) || 'N/A',
                                    length: parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0),
                                    width: parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0),
                                    height: parseFloat(result.getValue({ name: 'custitem_infor_pallet_height_inch' }) || 0),
                                    weight: parseFloat(weight || 0),
                                    netWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_std_net_weight' }) || 0),
                                    grossWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_gross_weight' }) || 0),
                                    maxWeightTon: weight, // Capture from JSON
                                    baseUnitAbbreviation: qtyUOM || baseUnitAbbreviation,
                                    binDAOS: binDAOS,
                                    uomConversionRates: uomConversionRates
                                };
    
                                var parentKey = parent + " - " + weight + baseUnitAbbreviation;
                                if (!boxesDAOS[parentKey]) {
                                    boxesDAOS[parentKey] = [];
                                }
                                boxesDAOS[parentKey].push(itemData);
                            });
                        }
                        log.debug('boxesDAOS', boxesDAOS);
    
                    }
    
                    if (productTypeName && productTypeName.toLowerCase().includes('double a colour paper')) {
    
                        jsonDataDACP = jsonData.items;
                        var productId = jsonDataDACP[i].custpage_product.id;
                        var weight = jsonDataDACP[i].custpage_quantity;
                        var containerId = jsonDataDACP[i].custpage_container.id;
    
                        // Load container details
                        var containerRec = record.load({
                            type: 'customrecord_exp_containerssize',
                            id: containerId
                        }); 
                        
                        var binDACP = {
                            size: containerRec.getText('name') || null,
                            length: parseFloat(containerRec.getValue('custrecord_con_dimensionlength')) || 0,
                            width: parseFloat(containerRec.getValue('custrecord_con_dimensionwide')) || 0,
                            height: parseFloat(containerRec.getValue('custrecord_con_dimensionheight')) || 0,
                            maxWeight: parseFloat(containerRec.getValue('custrecord_con_maxweight'))/1000 || 0
                        };
                        
                        // Load item details
                        var itemType = search.lookupFields({
                            type: search.Type.ITEM,
                            id: productId,
                            columns: ['recordtype']
                        }).recordtype;
    
                        var itemRecord = record.load({ type: itemType, id: productId });
                        var parent = itemRecord.getValue({ fieldId: 'displayname' });
                    
                        var itemSearch = search.create({
                            type: itemType,
                            filters: [
                                ['internalid', 'anyof', productId],
                                'AND',
                                ['custitem_infor_pallet_type', 'anyof', customerPallet]
                            ],
                            columns: [
                                'internalid', 'displayname', 'itemid', 'unitstype',
                                'custitem_infor_pallet_wide_inch', 'custitem_infor_pallet_length_inch',
                                'custitem_infor_pallet_height_inch', 'custitem_infor_std_net_weight',
                                'custitem_infor_gross_weight', 'custitem_infor_layer',
                            ]
                        });
                    
                        var searchResult = itemSearch.run().getRange({ start: 0, end: 1000 }) || [];
                    
                        if (searchResult.length > 0) {
                            searchResult.forEach(function (result) {
                                var unitTypeId = result.getValue({ name: 'unitstype' });
                                var uomConversionRates = {};
                                var baseUnitAbbreviation = '';
                    
                                if (unitTypeId) {
                                    var unitTypeRecord = record.load({ type: record.Type.UNITS_TYPE, id: unitTypeId });
                                    var lineCount = unitTypeRecord.getLineCount({ sublistId: 'uom' });
                    
                                    for (var j = 0; j < lineCount; j++) {
                                        var abbreviation = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'abbreviation', line: j });
                                        var baseUnit = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'baseunit', line: j });
                                        var conversionRate = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'conversionrate', line: j });
                    
                                        if (abbreviation) {
                                            abbreviation = abbreviation.toLowerCase();
                                            uomConversionRates[abbreviation] = parseFloat(conversionRate) || 1;
                                        }
        
                                        if (baseUnit === true) { // Fix for base unit check
                                            baseUnitAbbreviation = abbreviation;
                                        }
                                    }
                                }
                    
                                var itemData = {
                                    documentNo: 'A0108224Z',
                                    type: 'double a colour paper',
                                    unitstype: result.getText({ name: 'unitstype' }),
                                    product: result.getValue({ name: 'itemid' }),
                                    internalId: result.getValue({ name: 'internalid' }),
                                    displayName: result.getValue({ name: 'displayname' }),
                                    pallet: (parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0) > 0 &&
                                            parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0) > 0) ? 'true' : 'false',
                                    layer: result.getText({ name: 'custitem_infor_layer' }) || 'N/A',
                                    length: parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0),
                                    width: parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0),
                                    height: parseFloat(result.getValue({ name: 'custitem_infor_pallet_height_inch' }) || 0),
                                    weight: parseFloat(weight || 0),
                                    netWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_std_net_weight' }) || 0),
                                    grossWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_gross_weight' }) || 0),
                                    maxWeightTon: weight, // Capture from JSON
                                    baseUnitAbbreviation: qtyUOM || baseUnitAbbreviation,
                                    binDACP: binDACP,
                                    uomConversionRates: uomConversionRates,
                                };
                    
                                var parentKey = parent + " - " + weight + baseUnitAbbreviation;
                                if (!boxesDACP[parentKey]) {
                                    boxesDACP[parentKey] = [];
                                }
                                boxesDACP[parentKey].push(itemData);
                            });
                        }
                    } 
    
                    if (productTypeName && productTypeName.toLowerCase().includes('corrugating medium paper (sheet)')) {
    
                        jsonDataCMSheet = jsonData.items;
                        var productId = jsonDataCMSheet[i].custpage_product.id;
                        var weight = jsonDataCMSheet[i].custpage_quantity;
                        var containerId = jsonDataCMSheet[i].custpage_container.id;
    
                        // Load container details
                        var containerRec = record.load({
                            type: 'customrecord_exp_containerssize',
                            id: containerId
                        }); 
                        
                        var binCMSheet = {
                            size: containerRec.getText('name') || null,
                            length: parseFloat(containerRec.getValue('custrecord_con_dimensionlength')) || 0,
                            width: parseFloat(containerRec.getValue('custrecord_con_dimensionwide')) || 0,
                            height: parseFloat(containerRec.getValue('custrecord_con_dimensionheight')) || 0,
                            maxWeight: parseFloat(containerRec.getValue('custrecord_con_maxweight'))/1000 || 0
                        };
    
                        // Load item details
                        var itemType = search.lookupFields({
                            type: search.Type.ITEM,
                            id: productId,
                            columns: ['recordtype']
                        }).recordtype;
    
                        var itemRecord = record.load({ type: itemType, id: productId });
                        var parent = itemRecord.getValue({ fieldId: 'displayname' });
    
                        var itemSearch = search.create({
                            type: itemType,
                            filters: [
                                ['internalid', 'anyof', productId],
                                'AND',
                                ['custitem_infor_pallet_type', 'anyof', customerPallet]
                            ],
                            columns: [
                                'internalid', 'displayname', 'itemid', 'unitstype',
                                'custitem_infor_pallet_wide_inch', 'custitem_infor_pallet_length_inch',
                                'custitem_infor_pallet_height_inch', 'custitem_infor_std_net_weight',
                                'custitem_infor_gross_weight', 'custitem_infor_layer'
                            ]
                        });
    
                        var searchResult = itemSearch.run().getRange({ start: 0, end: 1000 }) || [];
    
                        if (searchResult.length > 0) {
                            searchResult.forEach(function (result) {
                                var unitTypeId = result.getValue({ name: 'unitstype' });
                                var uomConversionRates = {};
                                var baseUnitAbbreviation = '';
    
                                if (unitTypeId) {
                                    var unitTypeRecord = record.load({ type: record.Type.UNITS_TYPE, id: unitTypeId });
                                    var lineCount = unitTypeRecord.getLineCount({ sublistId: 'uom' });
    
                                    for (var j = 0; j < lineCount; j++) {
                                        var abbreviation = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'abbreviation', line: j });
                                        var baseUnit = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'baseunit', line: j });
                                        var conversionRate = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'conversionrate', line: j });
    
                                        if (abbreviation) {
                                            abbreviation = abbreviation.toLowerCase();
                                            uomConversionRates[abbreviation] = parseFloat(conversionRate) || 1;
                                        }
    
                                        if (baseUnit === true) { // Fix for base unit check
                                            baseUnitAbbreviation = abbreviation;
                                        }
                                    }
                                }
    
                                var itemData = {
                                    documentNo: 'T1259523F',
                                    type: 'CM Sheet',
                                    unitstype: result.getText({ name: 'unitstype' }),
                                    product: result.getValue({ name: 'itemid' }),
                                    internalId: result.getValue({ name: 'internalid' }),
                                    displayName: result.getValue({ name: 'displayname' }),
                                    pallet: (parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0) > 0 &&
                                            parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0) > 0) ? 'true' : 'false',
                                    layer: result.getText({ name: 'custitem_infor_layer' }) || 'N/A',
                                    length: parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0),
                                    width: parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0),
                                    height: parseFloat(result.getValue({ name: 'custitem_infor_pallet_height_inch' }) || 0),
                                    weight: parseFloat(weight || 0),
                                    netWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_std_net_weight' }) || 0),
                                    grossWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_gross_weight' }) || 0),
                                    maxWeightTon: weight, // Capture from JSON
                                    baseUnitAbbreviation: qtyUOM || baseUnitAbbreviation,
                                    binCMSheet: binCMSheet,
                                    uomConversionRates: uomConversionRates
                                };
    
                                var parentKey = parent + " - " + weight + baseUnitAbbreviation;
                                if (!boxesCMSheet[parentKey]) {
                                    boxesCMSheet[parentKey] = [];
                                }
                                boxesCMSheet[parentKey].push(itemData);
                            });
                        }
                        log.debug('boxesCMSheet', boxesCMSheet);
    
                    } 
    
                    if (productTypeName && productTypeName.toLowerCase().includes('wrapper'))
                    {
                    
                        jsonDataWrapper = jsonData.items;
                        var productId = jsonDataWrapper[i].custpage_product.id;
                        var weight = jsonDataWrapper[i].custpage_quantity;
                        var containerId = jsonDataWrapper[i].custpage_container.id;
    
                        // Load container details
                        var containerRec = record.load({
                            type: 'customrecord_exp_containerssize',
                            id: containerId
                        }); 
                        
                        var binWrapper = {
                            size: containerRec.getText('name') || null,
                            length: parseFloat(containerRec.getValue('custrecord_con_dimensionlength')) || 0,
                            width: parseFloat(containerRec.getValue('custrecord_con_dimensionwide')) || 0,
                            height: parseFloat(containerRec.getValue('custrecord_con_dimensionheight')) || 0,
                            maxWeight: parseFloat(containerRec.getValue('custrecord_con_maxweight'))/1000 || 0
                        };
    
                        // Load item details
                        var itemType = search.lookupFields({
                            type: search.Type.ITEM,
                            id: productId,
                            columns: ['recordtype']
                        }).recordtype;
    
                        var itemRecord = record.load({ type: itemType, id: productId });
                        var parent = itemRecord.getValue({ fieldId: 'displayname' });
    
                        var itemSearch = search.create({
                            type: itemType,
                            filters: [
                                ['internalid', 'anyof', productId],
                                'AND',
                                ['custitem_infor_pallet_type', 'anyof', customerPallet]
                            ],
                            columns: [
                                'internalid',
                                'displayname',
                                'itemid',
                                'unitstype',
                                'cseg_item_sub_group',
                                'custitem_infor_std_net_weight',
                                'custitem_infor_gross_weight',
                                'custitem_infor_diameter_mm',
                                'custitem_infor_width_mm',
                                'custitem_infor_core',
                            ]
                        });
    
                        var searchResult = itemSearch.run().getRange({ start: 0, end: 1000 }) || [];
    
                        if (searchResult.length > 0) {
                            searchResult.forEach(function (result) {
                                var unitTypeId = result.getValue({ name: 'unitstype' });
                                var uomConversionRates = {};
                                var baseUnitAbbreviation = '';
    
                                if (unitTypeId) {
                                    var unitTypeRecord = record.load({ type: record.Type.UNITS_TYPE, id: unitTypeId });
                                    var lineCount = unitTypeRecord.getLineCount({ sublistId: 'uom' });
    
                                    for (var j = 0; j < lineCount; j++) {
                                        var abbreviation = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'abbreviation', line: j });
                                        var baseUnit = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'baseunit', line: j });
                                        var conversionRate = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'conversionrate', line: j });
    
                                        if (abbreviation) {
                                            abbreviation = abbreviation.toLowerCase();
                                            uomConversionRates[abbreviation] = parseFloat(conversionRate) || 1;
                                        }
    
                                        if (baseUnit === true) { // Fix for base unit check
                                            baseUnitAbbreviation = abbreviation;
                                        }
                                    }
                                }
    
                                var itemData = {
                                    documentNo: 'T0373524R',
                                    type: 'wrapper',
                                    unitstype: result.getText({ name: 'unitstype' }),
                                    product: result.getValue({ name: 'itemid' }),
                                    internalId: result.getValue({ name: 'internalId' }),
                                    displayName: result.getValue({ name: 'displayname' }),
                                    weight: parseFloat(weight || 0),
                                    netWeightPerWrapper: parseFloat(result.getValue({ name: 'custitem_infor_std_net_weight' }) || 0),
                                    grossWeightPerWrapper: parseFloat(result.getValue({ name: 'custitem_infor_gross_weight' }) || 0),
                                    maxWeightTon: weight,
                                    baseUnitAbbreviation: qtyUOM || baseUnitAbbreviation,
                                    diameter: result.getText({ name: 'custitem_infor_diameter_mm' }),
                                    width: result.getValue({ name: 'custitem_infor_width_mm' }),
                                    core: result.getText({ name: 'custitem_infor_core' }),
                                    binWrapper: binWrapper,
                                    uomConversionRates: uomConversionRates
                                };
    
                                var parentKey = parent + " - " + weight + baseUnitAbbreviation;
                                if (!boxesWrapper[parentKey]) {
                                    boxesWrapper[parentKey] = [];
                                }
                                boxesWrapper[parentKey].push(itemData);
                            });
                        }
                        log.debug('boxesWrapper', boxesWrapper);
                    
                    }
    
                    if (
                        (productTypeName && productTypeName.toLowerCase().includes('corrugating medium paper (roll)'))
                    ) {
                    
                        jsonDataCMRoll = jsonData.items;
                        var productId = jsonDataCMRoll[i].custpage_product.id;
                        var weight = jsonDataCMRoll[i].custpage_quantity;
                        var containerId = jsonDataCMRoll[i].custpage_container.id;
    
                        // Load container details
                        var containerRec = record.load({
                            type: 'customrecord_exp_containerssize',
                            id: containerId
                        }); 
                        
                        var binCMRoll = {
                            size: containerRec.getText('name') || null,
                            length: parseFloat(containerRec.getValue('custrecord_con_dimensionlength')) || 0,
                            width: parseFloat(containerRec.getValue('custrecord_con_dimensionwide')) || 0,
                            height: parseFloat(containerRec.getValue('custrecord_con_dimensionheight')) || 0,
                            maxWeight: parseFloat(containerRec.getValue('custrecord_con_maxweight'))/1000 || 0
                        };
    
                        // Load item details
                        var itemType = search.lookupFields({
                            type: search.Type.ITEM,
                            id: productId,
                            columns: ['recordtype']
                        }).recordtype;
    
                        var itemRecord = record.load({ type: itemType, id: productId });
                        var parent = itemRecord.getValue({ fieldId: 'displayname' });
    
                        var itemSearch = search.create({
                            type: itemType,
                            filters: ['internalid', 'anyof', productId],
                            columns: [
                                'internalid',
                                'displayname',
                                'itemid',
                                'unitstype',
                                'cseg_item_sub_group',
                                'custitem_infor_std_net_weight',
                                'custitem_infor_gross_weight',
                                'custitem_infor_diameter_mm',
                                'custitem_infor_width_mm',
                                'custitem_infor_core',
                            ]
                        });
    
                        var searchResult = itemSearch.run().getRange({ start: 0, end: 1000 }) || [];
    
                        if (searchResult.length > 0) {
                            searchResult.forEach(function (result) {
                                var unitTypeId = result.getValue({ name: 'unitstype' });
                                var uomConversionRates = {};
                                var baseUnitAbbreviation = '';
    
                                if (unitTypeId) {
                                    var unitTypeRecord = record.load({ type: record.Type.UNITS_TYPE, id: unitTypeId });
                                    var lineCount = unitTypeRecord.getLineCount({ sublistId: 'uom' });
    
                                    for (var j = 0; j < lineCount; j++) {
                                        var abbreviation = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'abbreviation', line: j });
                                        var baseUnit = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'baseunit', line: j });
                                        var conversionRate = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'conversionrate', line: j });
    
                                        if (abbreviation) {
                                            abbreviation = abbreviation.toLowerCase();
                                            uomConversionRates[abbreviation] = parseFloat(conversionRate) || 1;
                                        }
    
                                        if (baseUnit === true) { // Fix for base unit check
                                            baseUnitAbbreviation = abbreviation;
                                        }
                                    }
                                }
    
                                var itemData = {
                                    documentNo: 'T0373524R',
                                    type: 'CM Roll',
                                    unitstype: result.getText({ name: 'unitstype' }),
                                    product: result.getValue({ name: 'itemid' }),
                                    internalId: result.getValue({ name: 'internalId' }),
                                    displayName: result.getValue({ name: 'displayname' }),
                                    weight: parseFloat(weight || 0),
                                    netWeightPerCMRoll: parseFloat(result.getValue({ name: 'custitem_infor_std_net_weight' }) || 0),
                                    grossWeightPerCMRoll: parseFloat(result.getValue({ name: 'custitem_infor_gross_weight' }) || 0),
                                    maxWeightTon: weight,
                                    baseUnitAbbreviation: qtyUOM || baseUnitAbbreviation,
                                    diameter: result.getText({ name: 'custitem_infor_diameter_mm' }),
                                    width: result.getValue({ name: 'custitem_infor_width_mm' }),
                                    core: result.getText({ name: 'custitem_infor_core' }),
                                    binCMRoll: binCMRoll,
                                    uomConversionRates: uomConversionRates
                                };
    
                                var parentKey = parent + " - " + weight + baseUnitAbbreviation;
                                if (!boxesCMRoll[parentKey]) {
                                    boxesCMRoll[parentKey] = [];
                                }
                                boxesCMRoll[parentKey].push(itemData);
                            });
                        }
                        log.debug('boxesCMRoll', boxesCMRoll);
                    
                    }
    
                    if (
                        (
                            (productTypeName && productTypeName.toLowerCase().includes('roll')) ||
                            (displayName && displayName.toLowerCase().includes('width'))
                        ) &&
                        (!productTypeName || !productTypeName.toLowerCase().includes('corrugating medium paper (roll)'))
                        &&
                        (!productTypeName || !productTypeName.toLowerCase().includes('honeycomb'))
                    )
                     {
                    
                        jsonDataRoll = jsonData.items;
                        var productId = jsonDataRoll[i].custpage_product.id;
                        var weight = jsonDataRoll[i].custpage_quantity;
                        var containerId = jsonDataRoll[i].custpage_container.id;
    
                        // Load container details
                        var containerRec = record.load({
                            type: 'customrecord_exp_containerssize',
                            id: containerId
                        }); 
                        
                        var binRoll = {
                            size: containerRec.getText('name') || null,
                            length: parseFloat(containerRec.getValue('custrecord_con_dimensionlength')) || 0,
                            width: parseFloat(containerRec.getValue('custrecord_con_dimensionwide')) || 0,
                            height: parseFloat(containerRec.getValue('custrecord_con_dimensionheight')) || 0,
                            maxWeight: parseFloat(containerRec.getValue('custrecord_con_maxweight'))/1000 || 0
                        };
    
                        // Load item details
                        var itemType = search.lookupFields({
                            type: search.Type.ITEM,
                            id: productId,
                            columns: ['recordtype']
                        }).recordtype;
    
                        var itemRecord = record.load({ type: itemType, id: productId });
                        var parent = itemRecord.getValue({ fieldId: 'displayname' });
    
                        var itemSearch = search.create({
                            type: itemType,
                            filters: ['internalid', 'anyof', productId],
                            columns: [
                                'internalid',
                                'displayname',
                                'itemid',
                                'unitstype',
                                'cseg_item_sub_group',
                                'custitem_infor_std_net_weight',
                                'custitem_infor_gross_weight',
                                'custitem_infor_diameter_mm',
                                'custitem_infor_width_mm',
                                'custitem_infor_core',
                            ]
                        });
    
                        var searchResult = itemSearch.run().getRange({ start: 0, end: 1000 }) || [];
    
                        if (searchResult.length > 0) {
                            searchResult.forEach(function (result) {
                                var unitTypeId = result.getValue({ name: 'unitstype' });
                                var uomConversionRates = {};
                                var baseUnitAbbreviation = '';
    
                                if (unitTypeId) {
                                    var unitTypeRecord = record.load({ type: record.Type.UNITS_TYPE, id: unitTypeId });
                                    var lineCount = unitTypeRecord.getLineCount({ sublistId: 'uom' });
    
                                    for (var j = 0; j < lineCount; j++) {
                                        var abbreviation = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'abbreviation', line: j });
                                        var baseUnit = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'baseunit', line: j });
                                        var conversionRate = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'conversionrate', line: j });
    
                                        if (abbreviation) {
                                            abbreviation = abbreviation.toLowerCase();
                                            uomConversionRates[abbreviation] = parseFloat(conversionRate) || 1;
                                        }
    
                                        if (baseUnit === true) { // Fix for base unit check
                                            baseUnitAbbreviation = abbreviation;
                                        }
                                    }
                                }
    
                                var itemData = {
                                    documentNo: 'T0373524R',
                                    type: 'roll',
                                    unitstype: result.getText({ name: 'unitstype' }),
                                    product: result.getValue({ name: 'itemid' }),
                                    internalId: result.getValue({ name: 'internalId' }),
                                    displayName: result.getValue({ name: 'displayname' }),
                                    weight: parseFloat(weight || 0),
                                    netWeightPerRoll: parseFloat(result.getValue({ name: 'custitem_infor_std_net_weight' }) || 0),
                                    grossWeightPerRoll: parseFloat(result.getValue({ name: 'custitem_infor_gross_weight' }) || 0),
                                    maxWeightTon: weight,
                                    baseUnitAbbreviation: qtyUOM || baseUnitAbbreviation,
                                    diameter: result.getText({ name: 'custitem_infor_diameter_mm' }),
                                    width: result.getValue({ name: 'custitem_infor_width_mm' }),
                                    core: result.getText({ name: 'custitem_infor_core' }),
                                    binRoll: binRoll,
                                    uomConversionRates: uomConversionRates
                                };
    
                                var parentKey = parent + " - " + weight + baseUnitAbbreviation;
                                if (!boxesRoll[parentKey]) {
                                    boxesRoll[parentKey] = [];
                                }
                                boxesRoll[parentKey].push(itemData);
                            });
                        }
                        log.debug('boxesroll', boxesRoll);
                    
                    }
                }  
            }
        } else {
            log.debug('no data received!');
        }

        if (jsonData.freeGifts) {
            for (var i = 0; i < jsonData.freeGifts.length; i++) {

                var itemId = jsonData.freeGifts[i].custpage_product.id;

                // First, get the item type using search.lookupFields
                var itemType = search.lookupFields({
                    type: 'item',
                    id: itemId,
                    columns: ['recordtype']
                }).recordtype;

                // Now load the item using the retrieved type
                var productTypeID = record.load({
                    type: itemType,
                    id: itemId
                }).getValue('custitem_infor_sca_itemsubtype');

                var productTypeName = null
                if (productTypeID){
                    var productTypeName = record.load({
                        type: 'customrecord_sca_itemsubtype_mappinglist',
                        id: productTypeID
                    }).getValue('name');
                }
                
                var displayName = record.load({
                    type: itemType,
                    id: itemId
                }).getValue('displayname');
                
                jsonDataFreeGifts = jsonData.freeGifts;
                var productId = jsonDataFreeGifts[i].custpage_product.id;
                var weight = jsonDataFreeGifts[i].custpage_quantity;
                var containerId = jsonDataFreeGifts[i].custpage_container.id;

                // Load container details
                var containerRec = record.load({
                    type: 'customrecord_exp_containerssize',
                    id: containerId
                }); 
                
                var bin = {
                    size: containerRec.getText('name') || null,
                    length: parseFloat(containerRec.getValue('custrecord_con_dimensionlength')) || 0,
                    width: parseFloat(containerRec.getValue('custrecord_con_dimensionwide')) || 0,
                    height: parseFloat(containerRec.getValue('custrecord_con_dimensionheight')) || 0,
                    maxWeight: parseFloat(containerRec.getValue('custrecord_con_maxweight'))/1000 || 0
                };

                // Load item details
                var itemType = search.lookupFields({
                    type: search.Type.ITEM,
                    id: productId,
                    columns: ['recordtype']
                }).recordtype;

                var itemRecord = record.load({ type: itemType, id: productId });
                var parent = itemRecord.getValue({ fieldId: 'displayname' });
            
                if (productTypeName && productTypeName.toLowerCase().includes('copy paper')){
                    var itemSearch = search.create({
                        type: itemType,
                        filters: [
                            ['parent', 'anyof', productId],
                            'AND',
                            ['custitem_infor_pallet_type', 'anyof', customerPallet]
                        ],
                        columns: [
                            'internalid', 'displayname', 'itemid', 'unitstype',
                            'custitem_infor_pallet_wide_inch', 'custitem_infor_pallet_length_inch',
                            'custitem_infor_pallet_height_inch', 'custitem_infor_std_net_weight',
                            'custitem_infor_gross_weight', 'custitem_infor_layer',
                        ]
                    });
                }  else if ((productTypeName && productTypeName.toLowerCase().includes('corrugating medium paper (roll)'))){

                    var itemSearch = search.create({
                        type: itemType,
                        filters: ['internalid', 'anyof', productId],
                        columns: [
                            'internalid',
                            'displayname',
                            'itemid',
                            'unitstype',
                            'cseg_item_sub_group',
                            'custitem_infor_std_net_weight',
                            'custitem_infor_gross_weight',
                            'custitem_infor_diameter_mm',
                            'custitem_infor_width_mm',
                            'custitem_infor_core',
                        ]
                    });

                } else if (
                    (
                        (productTypeName && productTypeName.toLowerCase().includes('roll')) ||
                        (displayName && displayName.toLowerCase().includes('width'))
                    ) &&
                    (!productTypeName || !productTypeName.toLowerCase().includes('corrugating medium paper (roll)'))
                    &&
                    (!productTypeName || !productTypeName.toLowerCase().includes('honeycomb'))
                ){

                    var itemSearch = search.create({
                        type: itemType,
                        filters: ['internalid', 'anyof', productId],
                        columns: [
                            'internalid',
                            'displayname',
                            'itemid',
                            'unitstype',
                            'cseg_item_sub_group',
                            'custitem_infor_std_net_weight',
                            'custitem_infor_gross_weight',
                            'custitem_infor_diameter_mm',
                            'custitem_infor_width_mm',
                            'custitem_infor_core',
                        ]
                    });

                } else {
                    var itemSearch = search.create({
                        type: itemType,
                        filters: [
                            ['internalid', 'anyof', productId],
                            'AND',
                            ['custitem_infor_pallet_type', 'anyof', customerPallet]
                        ],
                        columns: [
                            'internalid', 'displayname', 'itemid', 'unitstype',
                            'custitem_infor_pallet_wide_inch', 'custitem_infor_pallet_length_inch',
                            'custitem_infor_pallet_height_inch', 'custitem_infor_std_net_weight',
                            'custitem_infor_gross_weight', 'custitem_infor_layer',
                        ]
                    });
                }
            
                var searchResult = itemSearch.run().getRange({ start: 0, end: 1000 }) || [];
            
                if (searchResult.length > 0) {
                    searchResult.forEach(function (result) {
                        var unitTypeId = result.getValue({ name: 'unitstype' });
                        var uomConversionRates = {};
                        var baseUnitAbbreviation = '';
            
                        if (unitTypeId) {
                            var unitTypeRecord = record.load({ type: record.Type.UNITS_TYPE, id: unitTypeId });
                            var lineCount = unitTypeRecord.getLineCount({ sublistId: 'uom' });
            
                            for (var j = 0; j < lineCount; j++) {
                                var abbreviation = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'abbreviation', line: j });
                                var baseUnit = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'baseunit', line: j });
                                var conversionRate = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'conversionrate', line: j });
            
                                if (abbreviation) {
                                    abbreviation = abbreviation.toLowerCase();
                                    uomConversionRates[abbreviation] = parseFloat(conversionRate) || 1;
                                }

                                if (baseUnit === true) { // Fix for base unit check
                                    baseUnitAbbreviation = abbreviation;
                                }
                            }
                        }
            
                        var itemData = {
                            documentNo: 'A0108224Z',
                            type: 'free gift',
                            unitstype: result.getText({ name: 'unitstype' }),
                            product: result.getValue({ name: 'itemid' }),
                            internalId: result.getValue({ name: 'internalid' }),
                            displayName: result.getValue({ name: 'displayname' }),
                            pallet: (parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0) > 0 &&
                                    parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0) > 0) ? 'true' : 'false',
                            layer: result.getText({ name: 'custitem_infor_layer' }) || 'N/A',
                            length: parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0),
                            width: parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0),
                            height: parseFloat(result.getValue({ name: 'custitem_infor_pallet_height_inch' }) || 0),
                            weight: parseFloat(weight || 0),
                            netWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_std_net_weight' }) || 0),
                            grossWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_gross_weight' }) || 0),
                            maxWeightTon: weight, // Capture from JSON
                            baseUnitAbbreviation: baseUnitAbbreviation,
                            bin: bin,
                            uomConversionRates: uomConversionRates,

                        };
            
                        var parentKey = parent + " - " + weight + baseUnitAbbreviation;
                        if (!freeGifts[parentKey]) {
                            freeGifts[parentKey] = [];
                        }
                        freeGifts[parentKey].push(itemData);
                    });
                }
            }
        }

        if (jsonData.selectedOption) {
            selectedOption = jsonData.selectedOption;
        }

        // Targeted Suitelet URL
        var suitelet2 = 'https://8158655.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1907&deploy=1&compid=8158655&ns-at=AAEJ7tMQKPpOUgMFE0eHmj_qWpombdOocuAG-gpd4muqON9iT6o';
        var suitelet3 = 'https://8158655.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1693&deploy=1&compid=8158655&ns-at=AAEJ7tMQuDL0qZx_sUKJpUu0z6TuDn2Zx_BpEVeoSzRxzfKidLk';
        // var suitelet3 = 'https://8158655-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1693&deploy=1&compid=8158655_SB1&ns-at=AAEJ7tMQ4a8l3VQ7eg-36lfntXmfSwliX3LIy92_K_NwFkiyCKA';

        var action = jsonData.action || 'view3D';
        // Prepare the data payloadToSuitelet3
        var payloadToSuitelet2  = {
            action: action,
            freeGifts: freeGifts,
            selectedStatus: jsonData.selectedStatus,
            boxesMixed: boxesMixed,
            selectedOption: jsonData.selectedOption,
            boxesCutsize: boxesCutsize,
            boxesFolio: boxesFolio,
            boxesRoll: boxesRoll,
            boxesCMSheet: boxesCMSheet,
            boxesCMRoll: boxesCMRoll,
            boxesHoneycomb: boxesHoneycomb,
            boxesPulp: boxesPulp,
            boxesBoxCover: boxesBoxCover,
            boxesWrapper: boxesWrapper,
            boxesDAOS: boxesDAOS,
            boxesDAN: boxesDAN,
            boxesDACP: boxesDACP,
        };
        log.debug('payloadToSuitelet2 being sent to Suitelet', JSON.stringify(payloadToSuitelet2 , null, 2));

        // Send the data using https.post (server-side request)
        var response = https.post({
            url: suitelet2,
            body: JSON.stringify(payloadToSuitelet2), // Convert object to JSON
            headers: {
                'Content-Type': 'application/json'
            }
        });

        log.debug('action', action);
        if (action == 'viewContainerList'){

            var jsonResult2 = response.body;

            // Write result to the browser 
            context.response.setHeader({
                name: 'Content-Type',
                value: 'application/json'
            });
            
            context.response.write(jsonResult2);
           
        } else if (action == 'view3D'){

            var jsonResult2 = JSON.parse(response.body);
            var myCache = cache.getCache({ name: 'MySuiteletCache', scope: cache.Scope.PUBLIC });

            // Save your JSON data as string in cache
            var key = 'key_' + Date.now(); // unique key
            myCache.put({
                key: key,
                value: jsonResult2,
                expiration: 600 // cache expires in 10 minutes
            });

            // Confirm the value was stored
            var testValue = myCache.get({ key: key });
            log.debug('Cache Write Success', testValue);


            // Redirect to Suitelet 3 with the key param
            var fullUrl = suitelet3 + '&key=' + key;
            log.debug('Redirecting to Suitelet 3 URL', fullUrl);

            // redirect.redirect({
            //     url: fullUrl
            // });

            context.response.setHeader({
                name: 'Content-Type',
                value: 'application/json'
            });
            context.response.write(JSON.stringify({ redirectUrl: fullUrl }));
        }
        
    } else if (request.method === 'GET'){

        var freeGifts = {};
        var selectedOption = {};
        var boxesCutsize = {};
        var boxesFolio = {};
        var boxesRoll = {};
        var boxesCMSheet = {};
        var boxesCMRoll = {};
        var boxesHoneycomb = {};
        var boxesPulp = {};
        var boxesBoxCover = {};
        var boxesWrapper = {};
        var boxesDAOS = {};
        var boxesDAN = {};
        var boxesDACP = {};
        var boxesMixed = {};
        var jsonDataCutsize = null;
        var jsonDataFolio = null;
        var jsonDataRoll = null;
        var jsonDataCMSheet = null;
        var jsonDataCMRoll = null;
        var jsonDataHoneycomb = null;
        var jsonDataPulp = null;
        var jsonDataBoxCover = null;
        var jsonDataWrapper = null;
        var jsonDataDAOS = null;
        var jsonDataDAN = null;
        var jsonDataDACP = null;

        // Hardcoded JSON data
        jsonData = {
            "action": 'viewContainerList',

            // mixed products sample
            // "items": [
            //     {
            //         "custpage_container": { "id": "2" },
            //         "custpage_product": { "id": "12524" },
            //         "custpage_quantity": 3,
            //         "custpage_quantityuom": { "text": "Ton" },
            //     },
            //     // {
            //     //     "custpage_container": { "id": "2" },
            //     //     "custpage_product": { "id": "12431" },
            //     //     "custpage_quantity": 3,
            //     //     "custpage_quantityuom": { "text": "Ton" },
            //     // },
            //     {
            //         "custpage_container": { "id": "2" },
            //         "custpage_product": { "id": "40840" },
            //         "custpage_quantity": 1,
            //         "custpage_quantityuom": { "text": "Ton" },
            //     },
            //     {
            //         "custpage_container": { "id": "2" },
            //         "custpage_product": { "id": "40838" },
            //         "custpage_quantity": 1,
            //         "custpage_quantityuom": { "text": "Ton" },
            //     },
            //     {
            //         "custpage_container": { "id": "2" },
            //         "custpage_product": { "id": "40839" },
            //         "custpage_quantity": 1,
            //         "custpage_quantityuom": { "text": "Ton" },
            //     }
            //     // {
            //     //     "custpage_container": { "id": "2" },
            //     //     "custpage_product": { "id": "12380" },
            //     //     "custpage_quantity": 1,
            //     //     "custpage_quantityuom": { "text": "Ton" },
            //     // }
            // ],
            
            // copy paper sample
            // "items": [
            //     {
            //         "custpage_container": { "id": "2" },
            //         "custpage_product": { "id": "12522" },
            //         "custpage_quantity": 16,
            //         "custpage_quantityuom": { "text": "MT" },
            //     }
            // ],
            // "selectedOption": []

            // roll sample
            "items": [
                {
                    "custpage_container": { "id": "2" },
                    "custpage_product": { "id": "44225" },
                    "custpage_quantity": 17,
                    "custpage_quantityuom": { "text": "MT" },
                },
                {
                    "custpage_container": { "id": "2" },
                    "custpage_product": { "id": "44214" },
                    "custpage_quantity": 9,
                    "custpage_quantityuom": { "text": "MT" },
                }
            ],
            "selectedOption": []
        };
        var jsonCustomer = '36709';

        if (jsonData.items) {
            
            var mixed = false;
            var firstProductType = null;
            var productTypeID = null;
            var itemId = null;
            var itemType = null;

            for (var i = 0; i < jsonData.items.length; i++) {

                itemId = jsonData.items[i].custpage_product.id;

                itemType = search.lookupFields({
                    type: 'item',
                    id: itemId,
                    columns: ['recordtype']
                }).recordtype;

                productTypeID = record.load({
                    type: itemType,
                    id: itemId
                }).getValue('custitem_infor_sca_itemsubtype');

                if (i === 0) {
                    firstProductType = productTypeID;
                } else if (productTypeID !== firstProductType) {
                    mixed = true;
                    break;
                }
            }
            
            for (var i = 0; i < jsonData.items.length; i++) {

                var itemId = jsonData.items[i].custpage_product.id;
                var qtyUOM = jsonData.items[i].custpage_quantityuom.text;
                var containerId = jsonData.items[i].custpage_quantityuom.text;

                if (qtyUOM === 'EA'){
                    qtyUOM = 'box';
                } else if(qtyUOM === 'MT'){
                    qtyUOM = 'ton'
                }

                // First, get the item type using search.lookupFields
                var itemType = search.lookupFields({
                    type: 'item',
                    id: itemId,
                    columns: ['recordtype']
                }).recordtype;

                // Now load the item using the retrieved type
                var productTypeID = record.load({
                    type: itemType,
                    id: itemId
                }).getValue('custitem_infor_sca_itemsubtype');

                var productTypeName = null
                if (productTypeID){
                    var productTypeName = record.load({
                        type: 'customrecord_sca_itemsubtype_mappinglist',
                        id: productTypeID
                    }).getValue('name');
                }
                
                var displayName = record.load({
                    type: itemType,
                    id: itemId
                }).getValue('displayname');


                // Load Customer
                var customerRec = record.load({
                    type: 'customer',
                    id: jsonCustomer
                }); 
                

                // Load Pallet by Customer details
                var containerPalletByCustomerSearch = search.create({
                    type: 'customrecord_container_pallet_by_cust',
                    filters: [
                        ['custrecord_customer', 'is', jsonCustomer]
                    ],
                    columns: ['custrecord_country', 'custrecord_pallet_type']
                });
                var containerPalletResults = containerPalletByCustomerSearch.run().getRange({ start: 0, end: 1 }) || [];
                var customerPallet = null;
                if (containerPalletResults.length > 0) {
                    customerPallet = containerPalletResults[0].getValue('custrecord_pallet_type');
                    customerPallet = customerPallet ? customerPallet.split(',') : [];
                }

                // Load Special Condition
                var specialConditionSearch = search.create({
                    type: 'customrecord_special_condition',
                    filters: [
                        ['custrecord_criteria_salechannel', 'anyof', customerRec.getValue('cseg_sale_channel')], 'AND',
                        ['custrecord_criteria_shiptocountry', 'anyof', customerRec.getValue('custentity_ship_to_country')], 'AND',
                        ['custrecord_criteria_distributionchannel', 'anyof', customerRec.getValue('cseg_dist_chanl')], 'AND',
                        ['custrecord_criteria_containersize', 'anyof', containerId], 'AND', 
                        ['custrecord_criteria_pallettype', 'anyof', customerPallet]
                    ],                            
                    columns: ['custrecord_title', 'custrecord_criteria_shiptocountry', 'custrecord_criteria_pallettype', 'custrecord_criteria_scaitemsubtype', 'custrecord_criteria_gram', 'custrecord_criteria_papersize', 
                                'custrecord_criteria_layer', 'custrecord_criteria_reamsperpallet', 'custrecord_criteria_sheet', 'custrecord_guideline_pallettype', 'custrecord_guideline_minnetweight',
                                'custrecord_guideline_maxpallets', 'custrecord_guideline_maxlayers', 'custrecord_guideline_position', 'custrecord_guideline_condition']
                });
                
                var specialConditionResult = specialConditionSearch.run().getRange({
                    start: 0,
                    end: 200
                }) || [];
                
                var specialConditions = [];
                
                if (specialConditionResult && specialConditionResult.length > 0) {
                    specialConditionResult.forEach(function (rec) {
                        var scData = {
                            scTitle: rec.getValue('custrecord_title'),
                            scShiptocountry: rec.getValue('custrecord_criteria_shiptocountry'),
                            scScaitemsubtype: rec.getValue('custrecord_criteria_scaitemsubtype'),
                            scGram: rec.getValue('custrecord_criteria_gram'),
                            scPapersize: rec.getValue('custrecord_criteria_papersize'),
                            scPallettype: rec.getValue('custrecord_criteria_pallettype'),
                            scLayer: rec.getValue('custrecord_criteria_layer') ? rec.getValue('custrecord_criteria_layer').split(',') : [],
                            scReamsperpallet: rec.getValue('custrecord_criteria_reamsperpallet'),
                            scSheet: rec.getValue('custrecord_criteria_sheet'),
                
                            scMinNetWeight: rec.getValue('custrecord_guideline_minnetweight'),
                            scMaxPallets: rec.getValue('custrecord_guideline_maxpallets'),
                            scMaxLayers: rec.getValue('custrecord_guideline_maxlayers'),
                            scPosition: rec.getValue('custrecord_guideline_position'),
                            scCondition: rec.getValue('custrecord_guideline_condition')
                        };
                
                        specialConditions.push(scData);
                    });
                }
                
                // Example usage:
                log.debug('custentity_ship_to_country', customerRec.getValue('custentity_ship_to_country'));
                log.debug('Special Conditions', specialConditions);
                
                
                var filters = [
                    ['custitem_infor_pallet_type', 'anyof', customerPallet]
                ];
                
                if (specialConditions && specialConditions.length > 0) {
                    var layerFilters = [];
                    var papersizeFilters = [];
                    var scaItemSubtypeFilters = null;
                    var gramFilters = null;
                
                    specialConditions.forEach(function(sc, index) {
                        if (index > 0) {
                            layerFilters.push('OR');
                            papersizeFilters.push('OR');
                        }
                
                        log.debug('sc.scLayer', sc.scLayer);
                        log.debug('sc.scLayer.length', sc.scLayer.length);
                        if (sc.scLayer && sc.scLayer.length > 0) {
                            layerFilters.push(['custitem_infor_layer', 'anyof', sc.scLayer]);
                        }
                
                        if (sc.scPapersize && sc.scPapersize.length > 0) {
                            papersizeFilters.push(['custitem_infor_paper_size', 'anyof', sc.scPapersize]);
                        }

                        if (sc.scScaitemsubtype) {
                            scaItemSubtypeFilters = ['custitem_infor_sca_itemsubtype', 'is', sc.scScaitemsubtype];
                        }

                        if (sc.scGram) {
                            gramFilters = ['cseg_item_gram', 'is', sc.scGram];
                        }
                    });
                
                    // Push blocks into main filters
                    if (layerFilters.length > 0) {
                        filters.push('AND');
                        filters.push.apply(filters, layerFilters); 
                    }

                    if (papersizeFilters.length > 0) {
                        filters.push('AND');
                        filters.push(papersizeFilters);
                    }

                    if (scaItemSubtypeFilters) {
                        filters.push('AND', scaItemSubtypeFilters);
                    }

                    if (gramFilters) {
                        filters.push('AND', gramFilters);
                    }
                }
                log.debug('filters', filters);
                
                if (mixed === true) {

                    jsonDataMixed = jsonData.items;
                    var productId = jsonDataMixed[i].custpage_product.id;
                    var weight = jsonDataMixed[i].custpage_quantity;
                    var containerId = jsonDataMixed[i].custpage_container.id;

                    // Load container details
                    var containerRec = record.load({
                        type: 'customrecord_exp_containerssize',
                        id: containerId
                    }); 
                    
                    var binMixed = {
                        size: containerRec.getText('name') || null,
                        length: parseFloat(containerRec.getValue('custrecord_con_dimensionlength')) || 0,
                        width: parseFloat(containerRec.getValue('custrecord_con_dimensionwide')) || 0,
                        height: parseFloat(containerRec.getValue('custrecord_con_dimensionheight')) || 0,
                        maxWeight: parseFloat(containerRec.getValue('custrecord_con_maxweight'))/1000 || 0
                    };
                    
                    // Load item details
                    var itemType = search.lookupFields({
                        type: search.Type.ITEM,
                        id: productId,
                        columns: ['recordtype']
                    }).recordtype;

                    var itemRecord = record.load({ type: itemType, id: productId });
                    var parent = itemRecord.getValue({ fieldId: 'displayname' });
                
                    if (productTypeName && productTypeName.toLowerCase().includes('copy paper')){
                        var itemSearch = search.create({
                            type: itemType,
                            filters: [['parent', 'anyof', productId]],
                            columns: [
                                'internalid', 'displayname', 'itemid', 'unitstype',
                                'custitem_infor_pallet_wide_inch', 'custitem_infor_pallet_length_inch',
                                'custitem_infor_pallet_height_inch', 'custitem_infor_std_net_weight',
                                'custitem_infor_gross_weight', 'custitem_infor_layer',
                            ]
                        });

                    } else {
                        var itemSearch = search.create({
                            type: itemType,
                            filters: [['internalid', 'anyof', productId]],
                            columns: [
                                'internalid', 'displayname', 'itemid', 'unitstype',
                                'custitem_infor_pallet_wide_inch', 'custitem_infor_pallet_length_inch',
                                'custitem_infor_pallet_height_inch', 'custitem_infor_std_net_weight',
                                'custitem_infor_gross_weight', 'custitem_infor_layer',
                            ]
                        });
                    }

                    var searchResult = itemSearch.run().getRange({ start: 0, end: 1000 }) || [];
                
                    if (searchResult.length > 0) {
                        searchResult.forEach(function (result) {
                            var unitTypeId = result.getValue({ name: 'unitstype' });
                            var uomConversionRates = {};
                            var baseUnitAbbreviation = '';
                
                            if (unitTypeId) {
                                var unitTypeRecord = record.load({ type: record.Type.UNITS_TYPE, id: unitTypeId });
                                var lineCount = unitTypeRecord.getLineCount({ sublistId: 'uom' });
                
                                for (var j = 0; j < lineCount; j++) {
                                    var abbreviation = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'abbreviation', line: j });
                                    var baseUnit = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'baseunit', line: j });
                                    var conversionRate = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'conversionrate', line: j });
                
                                    if (abbreviation) {
                                        abbreviation = abbreviation.toLowerCase();
                                        uomConversionRates[abbreviation] = parseFloat(conversionRate) || 1;
                                    }
    
                                    if (baseUnit === true) { // Fix for base unit check
                                        baseUnitAbbreviation = abbreviation;
                                    }
                                }
                            }
                
                            var itemData = {
                                documentNo: 'A0108224Z',
                                type: productTypeName,
                                mixed: true,
                                unitstype: result.getText({ name: 'unitstype' }),
                                product: result.getValue({ name: 'itemid' }),
                                internalId: result.getValue({ name: 'internalid' }),
                                displayName: result.getValue({ name: 'displayname' }),
                                pallet: (parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0) > 0 &&
                                        parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0) > 0) ? 'true' : 'false',
                                layer: result.getText({ name: 'custitem_infor_layer' }) || 'N/A',
                                length: parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0),
                                width: parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0),
                                height: parseFloat(result.getValue({ name: 'custitem_infor_pallet_height_inch' }) || 0),
                                weight: parseFloat(weight || 0),
                                netWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_std_net_weight' }) || 0),
                                grossWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_gross_weight' }) || 0),
                                maxWeightTon: weight, // Capture from JSON
                                baseUnitAbbreviation: qtyUOM || baseUnitAbbreviation,
                                binMixed: binMixed,
                                uomConversionRates: uomConversionRates,

                            };
                
                            var parentKey = parent + " - " + weight + baseUnitAbbreviation;
                            if (!boxesMixed[parentKey]) {
                                boxesMixed[parentKey] = [];
                            }
                            boxesMixed[parentKey].push(itemData);
                        });
                    }
                }  else {
                    if (productTypeName && productTypeName.toLowerCase().includes('copy paper')) {

                        jsonDataCutsize = jsonData.items;
                        var productId = jsonDataCutsize[i].custpage_product.id;
                        var weight = jsonDataCutsize[i].custpage_quantity;
                        var containerId = jsonDataCutsize[i].custpage_container.id;     
                        
                        // Load container details
                        var containerRec = record.load({
                            type: 'customrecord_exp_containerssize',
                            id: containerId
                        }); 

                        var binCutsize = {
                            size: containerRec.getText('name') || null,
                            length: parseFloat(containerRec.getValue('custrecord_con_dimensionlength')) || 0,
                            width: parseFloat(containerRec.getValue('custrecord_con_dimensionwide')) || 0,
                            height: parseFloat(containerRec.getValue('custrecord_con_dimensionheight')) || 0,
                            maxWeight: parseFloat(containerRec.getValue('custrecord_con_maxweight'))/1000 || 0
                        };
                        
                        // Load item details
                        var itemType = search.lookupFields({
                            type: search.Type.ITEM,
                            id: productId,
                            columns: ['recordtype']
                        }).recordtype;
    
                        var itemRecord = record.load({ type: itemType, id: productId });
                        var parent = itemRecord.getValue({ fieldId: 'displayname' });
                        
                        filters.push('AND', ['parent', 'is', productId]);
                        log.debug('filters2', filters);
                        var itemSearch = search.create({
                            type: itemType,
                            filters: filters,
                            columns: [
                                'internalid',
                                'custitem_infor_layer',
                                'custitem_infor_pallet_type',
                                'displayname',
                                'itemid',
                                'unitstype',
                                'custitem_infor_pallet_wide_inch',
                                'custitem_infor_pallet_length_inch',
                                'custitem_infor_pallet_height_inch',
                                'custitem_infor_std_net_weight',
                                'custitem_infor_gross_weight'
                            ]
                        });
                        var searchResult = itemSearch.run().getRange({ start: 0, end: 1000 }) || [];

                        log.debug('searchresult', searchResult);
                        log.debug('searchResult.length', searchResult.length);

                        if (searchResult.length > 0) {
                            searchResult.forEach(function (result) {
                                var unitTypeId = result.getValue({ name: 'unitstype' });
                                var uomConversionRates = {};
                                var baseUnitAbbreviation = '';
                    
                                if (unitTypeId) {
                                    var unitTypeRecord = record.load({ type: record.Type.UNITS_TYPE, id: unitTypeId });
                                    var lineCount = unitTypeRecord.getLineCount({ sublistId: 'uom' });
                    
                                    for (var j = 0; j < lineCount; j++) {
                                        var abbreviation = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'abbreviation', line: j });
                                        var baseUnit = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'baseunit', line: j });
                                        var conversionRate = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'conversionrate', line: j });
                    
                                        if (abbreviation) {
                                            abbreviation = abbreviation.toLowerCase();
                                            uomConversionRates[abbreviation] = parseFloat(conversionRate) || 1;
                                        }
        
                                        if (baseUnit === true) { // Fix for base unit check
                                            baseUnitAbbreviation = abbreviation;
                                        }
                                    }
                                }
                                    
                                var itemData = {
                                    documentNo: 'A0108224Z',
                                    type: 'cutsize',
                                    unitstype: result.getText({ name: 'unitstype' }),
                                    product: result.getValue({ name: 'itemid' }),
                                    internalId: result.getValue({ name: 'internalid' }),
                                    displayName: result.getValue({ name: 'displayname' }),
                                    pallet: (parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0) > 0 &&
                                            parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0) > 0) ? 'true' : 'false',
                                    layer: result.getText({ name: 'custitem_infor_layer' }) || 'N/A',
                                    length: parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0),
                                    width: parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0),
                                    height: parseFloat(result.getValue({ name: 'custitem_infor_pallet_height_inch' }) || 0),
                                    weight: parseFloat(weight || 0),
                                    netWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_std_net_weight' }) || 0),
                                    grossWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_gross_weight' }) || 0),
                                    maxWeightTon: weight, // Capture from JSON
                                    baseUnitAbbreviation: qtyUOM || baseUnitAbbreviation,
                                    binCutsize: binCutsize,
                                    uomConversionRates: uomConversionRates,
    
                                };
                    
                                var parentKey = parent + " - " + weight + baseUnitAbbreviation;
                                if (!boxesCutsize[parentKey]) {
                                    boxesCutsize[parentKey] = [];
                                }
                                boxesCutsize[parentKey].push(itemData);
                            });
                        }
                    }  
                    
                    if (productTypeName && (productTypeName.toLowerCase().includes('ream wrap on pallet (rop)') || productTypeName.toLowerCase().includes('bulk pack on pallet (bpop)'))) {
                        
                        jsonDataFolio = jsonData.items;
                        var productId = jsonDataFolio[i].custpage_product.id;
                        var weight = jsonDataFolio[i].custpage_quantity;
                        var containerId = jsonDataFolio[i].custpage_container.id;
    
                        // Load container details
                        var containerRec = record.load({
                            type: 'customrecord_exp_containerssize',
                            id: containerId
                        }); 
                        
                        var binFolio = {
                            size: containerRec.getText('name') || null,
                            length: parseFloat(containerRec.getValue('custrecord_con_dimensionlength')) || 0,
                            width: parseFloat(containerRec.getValue('custrecord_con_dimensionwide')) || 0,
                            height: parseFloat(containerRec.getValue('custrecord_con_dimensionheight')) || 0,
                            maxWeight: parseFloat(containerRec.getValue('custrecord_con_maxweight'))/1000 || 0
                        };
    
                        // Load item details
                        var itemType = search.lookupFields({
                            type: search.Type.ITEM,
                            id: productId,
                            columns: ['recordtype']
                        }).recordtype;
    
                        var itemRecord = record.load({ type: itemType, id: productId });
                        var parent = itemRecord.getValue({ fieldId: 'displayname' });
    
                        var itemSearch = search.create({
                            type: itemType,
                            filters: [
                                ['internalid', 'anyof', productId],
                                'AND',
                                ['custitem_infor_pallet_type', 'anyof', customerPallet]
                            ],
                            columns: [
                                'internalid', 'displayname', 'itemid', 'unitstype',
                                'custitem_infor_pallet_wide_inch', 'custitem_infor_pallet_length_inch',
                                'custitem_infor_pallet_height_inch', 'custitem_infor_std_net_weight',
                                'custitem_infor_gross_weight', 'custitem_infor_layer'
                            ]
                        });
    
                        var searchResult = itemSearch.run().getRange({ start: 0, end: 1000 }) || [];

                        if (searchResult.length > 0) {
                            searchResult.forEach(function (result) {
                                var unitTypeId = result.getValue({ name: 'unitstype' });
                                var uomConversionRates = {};
                                var baseUnitAbbreviation = '';
    
                                if (unitTypeId) {
                                    var unitTypeRecord = record.load({ type: record.Type.UNITS_TYPE, id: unitTypeId });
                                    var lineCount = unitTypeRecord.getLineCount({ sublistId: 'uom' });
    
                                    for (var j = 0; j < lineCount; j++) {
                                        var abbreviation = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'abbreviation', line: j });
                                        var baseUnit = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'baseunit', line: j });
                                        var conversionRate = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'conversionrate', line: j });
    
                                        if (abbreviation) {
                                            abbreviation = abbreviation.toLowerCase();
                                            uomConversionRates[abbreviation] = parseFloat(conversionRate) || 1;
                                        }
    
                                        if (baseUnit === true) { // Fix for base unit check
                                            baseUnitAbbreviation = abbreviation;
                                        }
                                    }
                                }
    
                                var itemData = {
                                    documentNo: 'T1259523F',
                                    type: 'folio',
                                    unitstype: result.getText({ name: 'unitstype' }),
                                    product: result.getValue({ name: 'itemid' }),
                                    internalId: result.getValue({ name: 'internalid' }),
                                    displayName: result.getValue({ name: 'displayname' }),
                                    pallet: (parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0) > 0 &&
                                            parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0) > 0) ? 'true' : 'false',
                                    layer: result.getText({ name: 'custitem_infor_layer' }) || 'N/A',
                                    length: parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0),
                                    width: parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0),
                                    height: parseFloat(result.getValue({ name: 'custitem_infor_pallet_height_inch' }) || 0),
                                    weight: parseFloat(weight || 0),
                                    netWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_std_net_weight' }) || 0),
                                    grossWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_gross_weight' }) || 0),
                                    maxWeightTon: weight, // Capture from JSON
                                    baseUnitAbbreviation: qtyUOM || baseUnitAbbreviation,
                                    binFolio: binFolio,
                                    uomConversionRates: uomConversionRates
                                };
    
                                var parentKey = parent + " - " + weight + baseUnitAbbreviation;
                                if (!boxesFolio[parentKey]) {
                                    boxesFolio[parentKey] = [];
                                }
                                boxesFolio[parentKey].push(itemData);
                            });
                        }
                        log.debug('boxesfolio', boxesFolio);
    
                    }   
    
                    if (productTypeName && productTypeName.toLowerCase().includes('honeycomb')) {
    
                        jsonDataHoneycomb = jsonData.items;
                        var productId = jsonDataHoneycomb[i].custpage_product.id;
                        var weight = jsonDataHoneycomb[i].custpage_quantity;
                        var containerId = jsonDataHoneycomb[i].custpage_container.id;
    
                        // Load container details
                        var containerRec = record.load({
                            type: 'customrecord_exp_containerssize',
                            id: containerId
                        }); 
                        
                        var binHoneycomb = {
                            size: containerRec.getText('name') || null,
                            length: parseFloat(containerRec.getValue('custrecord_con_dimensionlength')) || 0,
                            width: parseFloat(containerRec.getValue('custrecord_con_dimensionwide')) || 0,
                            height: parseFloat(containerRec.getValue('custrecord_con_dimensionheight')) || 0,
                            maxWeight: parseFloat(containerRec.getValue('custrecord_con_maxweight'))/1000 || 0
                        };
    
                        // Load item details
                        var itemType = search.lookupFields({
                            type: search.Type.ITEM,
                            id: productId,
                            columns: ['recordtype']
                        }).recordtype;
    
                        var itemRecord = record.load({ type: itemType, id: productId });
                        var parent = itemRecord.getValue({ fieldId: 'displayname' });
    
                        var itemSearch = search.create({
                            type: itemType,
                            filters: [
                                ['internalid', 'anyof', productId],
                                'AND',
                                ['custitem_infor_pallet_type', 'anyof', customerPallet]
                            ],
                            columns: [
                                'internalid', 'displayname', 'itemid', 'unitstype',
                                'custitem_infor_pallet_wide_inch', 'custitem_infor_pallet_length_inch',
                                'custitem_infor_pallet_height_inch', 'custitem_infor_std_net_weight',
                                'custitem_infor_gross_weight', 'custitem_infor_layer'
                            ]
                        });
    
                        var searchResult = itemSearch.run().getRange({ start: 0, end: 1000 }) || [];
    
                        if (searchResult.length > 0) {
                            searchResult.forEach(function (result) {
                                var unitTypeId = result.getValue({ name: 'unitstype' });
                                var uomConversionRates = {};
                                var baseUnitAbbreviation = '';
    
                                if (unitTypeId) {
                                    var unitTypeRecord = record.load({ type: record.Type.UNITS_TYPE, id: unitTypeId });
                                    var lineCount = unitTypeRecord.getLineCount({ sublistId: 'uom' });
    
                                    for (var j = 0; j < lineCount; j++) {
                                        var abbreviation = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'abbreviation', line: j });
                                        var baseUnit = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'baseunit', line: j });
                                        var conversionRate = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'conversionrate', line: j });
    
                                        if (abbreviation) {
                                            abbreviation = abbreviation.toLowerCase();
                                            uomConversionRates[abbreviation] = parseFloat(conversionRate) || 1;
                                        }
    
                                        if (baseUnit === true) { // Fix for base unit check
                                            baseUnitAbbreviation = abbreviation;
                                        }
                                    }
                                }
    
                                var itemData = {
                                    documentNo: 'T1259523F',
                                    type: 'honeycomb',
                                    unitstype: result.getText({ name: 'unitstype' }),
                                    product: result.getValue({ name: 'itemid' }),
                                    internalId: result.getValue({ name: 'internalid' }),
                                    displayName: result.getValue({ name: 'displayname' }),
                                    pallet: (parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0) > 0 &&
                                            parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0) > 0) ? 'true' : 'false',
                                    layer: result.getText({ name: 'custitem_infor_layer' }) || 'N/A',
                                    length: parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0),
                                    width: parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0),
                                    height: parseFloat(result.getValue({ name: 'custitem_infor_pallet_height_inch' }) || 0),
                                    weight: parseFloat(weight || 0),
                                    netWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_std_net_weight' }) || 0),
                                    grossWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_gross_weight' }) || 0),
                                    maxWeightTon: weight, // Capture from JSON
                                    baseUnitAbbreviation: qtyUOM || baseUnitAbbreviation,
                                    binHoneycomb: binHoneycomb,
                                    uomConversionRates: uomConversionRates
                                };
    
                                var parentKey = parent + " - " + weight + baseUnitAbbreviation;
                                if (!boxesHoneycomb[parentKey]) {
                                    boxesHoneycomb[parentKey] = [];
                                }
                                boxesHoneycomb[parentKey].push(itemData);
                            });
                        }
                        log.debug('boxesHoneycomb', boxesHoneycomb);
    
                    }   
    
                    if (productTypeName && productTypeName.toLowerCase().includes('pulp')) {
    
                        jsonDataPulp = jsonData.items;
                        var productId = jsonDataPulp[i].custpage_product.id;
                        var weight = jsonDataPulp[i].custpage_quantity;
                        var containerId = jsonDataPulp[i].custpage_container.id;
    
                        // Load container details
                        var containerRec = record.load({
                            type: 'customrecord_exp_containerssize',
                            id: containerId
                        }); 
                        
                        var binPulp = {
                            size: containerRec.getText('name') || null,
                            length: parseFloat(containerRec.getValue('custrecord_con_dimensionlength')) || 0,
                            width: parseFloat(containerRec.getValue('custrecord_con_dimensionwide')) || 0,
                            height: parseFloat(containerRec.getValue('custrecord_con_dimensionheight')) || 0,
                            maxWeight: parseFloat(containerRec.getValue('custrecord_con_maxweight'))/1000 || 0
                        };
    
                        // Load item details
                        var itemType = search.lookupFields({
                            type: search.Type.ITEM,
                            id: productId,
                            columns: ['recordtype']
                        }).recordtype;
    
                        var itemRecord = record.load({ type: itemType, id: productId });
                        var parent = itemRecord.getValue({ fieldId: 'displayname' });
    
                        var itemSearch = search.create({
                            type: itemType,
                            filters: ['internalid', 'anyof', productId],
                            columns: [
                                'internalid', 'displayname', 'itemid', 'unitstype',
                                'custitem_infor_pallet_wide_inch', 'custitem_infor_pallet_length_inch',
                                'custitem_infor_pallet_height_inch', 'custitem_infor_std_net_weight',
                                'custitem_infor_gross_weight', 'custitem_infor_layer'
                            ]
                        });
    
                        var searchResult = itemSearch.run().getRange({ start: 0, end: 1000 }) || [];
    
                        if (searchResult.length > 0) {
                            searchResult.forEach(function (result) {
                                var unitTypeId = result.getValue({ name: 'unitstype' });
                                var uomConversionRates = {};
                                var baseUnitAbbreviation = '';
    
                                if (unitTypeId) {
                                    var unitTypeRecord = record.load({ type: record.Type.UNITS_TYPE, id: unitTypeId });
                                    var lineCount = unitTypeRecord.getLineCount({ sublistId: 'uom' });
    
                                    for (var j = 0; j < lineCount; j++) {
                                        var abbreviation = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'abbreviation', line: j });
                                        var baseUnit = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'baseunit', line: j });
                                        var conversionRate = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'conversionrate', line: j });
    
                                        if (abbreviation) {
                                            abbreviation = abbreviation.toLowerCase();
                                            uomConversionRates[abbreviation] = parseFloat(conversionRate) || 1;
                                        }
    
                                        if (baseUnit === true) { // Fix for base unit check
                                            baseUnitAbbreviation = abbreviation;
                                        }
                                    }
                                }
    
                                var itemData = {
                                    documentNo: 'T1259523F',
                                    type: 'pulp',
                                    unitstype: result.getText({ name: 'unitstype' }),
                                    product: result.getValue({ name: 'itemid' }),
                                    internalId: result.getValue({ name: 'internalid' }),
                                    displayName: result.getValue({ name: 'displayname' }),
                                    pallet: (parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0) > 0 &&
                                            parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0) > 0) ? 'true' : 'false',
                                    layer: result.getText({ name: 'custitem_infor_layer' }) || 'N/A',
                                    length: parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0),
                                    width: parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0),
                                    height: parseFloat(result.getValue({ name: 'custitem_infor_pallet_height_inch' }) || 0),
                                    weight: parseFloat(weight || 0),
                                    netWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_std_net_weight' }) || 0),
                                    grossWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_gross_weight' }) || 0),
                                    maxWeightTon: weight, // Capture from JSON
                                    baseUnitAbbreviation: qtyUOM || baseUnitAbbreviation,
                                    binPulp: binPulp,
                                    uomConversionRates: uomConversionRates
                                };
    
                                var parentKey = parent + " - " + weight + baseUnitAbbreviation;
                                if (!boxesPulp[parentKey]) {
                                    boxesPulp[parentKey] = [];
                                }
                                boxesPulp[parentKey].push(itemData);
                            });
                        }
                        log.debug('boxesPulp', boxesPulp);
    
                    } 
    
                    if (productTypeName && productTypeName.toLowerCase().includes('box and cover')) {
    
                        jsonDataBoxCover = jsonData.items;
                        var productId = jsonDataBoxCover[i].custpage_product.id;
                        var weight = jsonDataBoxCover[i].custpage_quantity;
                        var containerId = jsonDataBoxCover[i].custpage_container.id;
    
                        // Load container details
                        var containerRec = record.load({
                            type: 'customrecord_exp_containerssize',
                            id: containerId
                        }); 
                        
                        var binBoxCover = {
                            size: containerRec.getText('name') || null,
                            length: parseFloat(containerRec.getValue('custrecord_con_dimensionlength')) || 0,
                            width: parseFloat(containerRec.getValue('custrecord_con_dimensionwide')) || 0,
                            height: parseFloat(containerRec.getValue('custrecord_con_dimensionheight')) || 0,
                            maxWeight: parseFloat(containerRec.getValue('custrecord_con_maxweight'))/1000 || 0
                        };
    
                        // Load item details
                        var itemType = search.lookupFields({
                            type: search.Type.ITEM,
                            id: productId,
                            columns: ['recordtype']
                        }).recordtype;
    
                        var itemRecord = record.load({ type: itemType, id: productId });
                        var parent = itemRecord.getValue({ fieldId: 'displayname' });
    
                        var itemSearch = search.create({
                            type: itemType,
                            filters: [
                                ['internalid', 'anyof', productId],
                                'AND',
                                ['custitem_infor_pallet_type', 'anyof', customerPallet]
                            ],
                            columns: [
                                'internalid', 'displayname', 'itemid', 'unitstype',
                                'custitem_infor_pallet_wide_inch', 'custitem_infor_pallet_length_inch',
                                'custitem_infor_pallet_height_inch', 'custitem_infor_std_net_weight',
                                'custitem_infor_gross_weight', 'custitem_infor_layer'
                            ]
                        });
    
                        var searchResult = itemSearch.run().getRange({ start: 0, end: 1000 }) || [];
    
                        if (searchResult.length > 0) {
                            searchResult.forEach(function (result) {
                                var unitTypeId = result.getValue({ name: 'unitstype' });
                                var uomConversionRates = {};
                                var baseUnitAbbreviation = '';
    
                                if (unitTypeId) {
                                    var unitTypeRecord = record.load({ type: record.Type.UNITS_TYPE, id: unitTypeId });
                                    var lineCount = unitTypeRecord.getLineCount({ sublistId: 'uom' });
    
                                    for (var j = 0; j < lineCount; j++) {
                                        var abbreviation = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'abbreviation', line: j });
                                        var baseUnit = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'baseunit', line: j });
                                        var conversionRate = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'conversionrate', line: j });
    
                                        if (abbreviation) {
                                            abbreviation = abbreviation.toLowerCase();
                                            uomConversionRates[abbreviation] = parseFloat(conversionRate) || 1;
                                        }
    
                                        if (baseUnit === true) { // Fix for base unit check
                                            baseUnitAbbreviation = abbreviation;
                                        }
                                    }
                                }
    
                                var itemData = {
                                    documentNo: 'T1259523F',
                                    type: 'box and cover',
                                    unitstype: result.getText({ name: 'unitstype' }),
                                    product: result.getValue({ name: 'itemid' }),
                                    internalId: result.getValue({ name: 'internalid' }),
                                    displayName: result.getValue({ name: 'displayname' }),
                                    pallet: (parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0) > 0 &&
                                            parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0) > 0) ? 'true' : 'false',
                                    layer: result.getText({ name: 'custitem_infor_layer' }) || 'N/A',
                                    length: parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0),
                                    width: parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0),
                                    height: parseFloat(result.getValue({ name: 'custitem_infor_pallet_height_inch' }) || 0),
                                    weight: parseFloat(weight || 0),
                                    netWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_std_net_weight' }) || 0),
                                    grossWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_gross_weight' }) || 0),
                                    maxWeightTon: weight, // Capture from JSON
                                    baseUnitAbbreviation: qtyUOM || baseUnitAbbreviation,
                                    binBoxCover: binBoxCover,
                                    uomConversionRates: uomConversionRates
                                };
    
                                var parentKey = parent + " - " + weight + baseUnitAbbreviation;
                                if (!boxesBoxCover[parentKey]) {
                                    boxesBoxCover[parentKey] = [];
                                }
                                boxesBoxCover[parentKey].push(itemData);
                            });
                        }
                        log.debug('boxesBoxCover', boxesBoxCover);
    
                    } 
                    
                    if (productTypeName && productTypeName.toLowerCase().includes('double a notebook')) {
    
                        jsonDataDAN = jsonData.items;
                        var productId = jsonDataDAN[i].custpage_product.id;
                        var weight = jsonDataDAN[i].custpage_quantity;
                        var containerId = jsonDataDAN[i].custpage_container.id;
    
                        // Load container details
                        var containerRec = record.load({
                            type: 'customrecord_exp_containerssize',
                            id: containerId
                        }); 
                        
                        var binDAN = {
                            size: containerRec.getText('name') || null,
                            length: parseFloat(containerRec.getValue('custrecord_con_dimensionlength')) || 0,
                            width: parseFloat(containerRec.getValue('custrecord_con_dimensionwide')) || 0,
                            height: parseFloat(containerRec.getValue('custrecord_con_dimensionheight')) || 0,
                            maxWeight: parseFloat(containerRec.getValue('custrecord_con_maxweight'))/1000 || 0
                        };
    
                        // Load item details
                        var itemType = search.lookupFields({
                            type: search.Type.ITEM,
                            id: productId,
                            columns: ['recordtype']
                        }).recordtype;
    
                        var itemRecord = record.load({ type: itemType, id: productId });
                        var parent = itemRecord.getValue({ fieldId: 'displayname' });
    
                        var itemSearch = search.create({
                            type: itemType,
                            filters: [
                                ['internalid', 'anyof', productId],
                                'AND',
                                ['custitem_infor_pallet_type', 'anyof', customerPallet]
                            ],
                            columns: [
                                'internalid', 'displayname', 'itemid', 'unitstype',
                                'custitem_infor_pallet_wide_inch', 'custitem_infor_pallet_length_inch',
                                'custitem_infor_pallet_height_inch', 'custitem_infor_std_net_weight',
                                'custitem_infor_gross_weight', 'custitem_infor_layer'
                            ]
                        });
    
                        var searchResult = itemSearch.run().getRange({ start: 0, end: 1000 }) || [];
    
                        if (searchResult.length > 0) {
                            searchResult.forEach(function (result) {
                                var unitTypeId = result.getValue({ name: 'unitstype' });
                                var uomConversionRates = {};
                                var baseUnitAbbreviation = '';
    
                                if (unitTypeId) {
                                    var unitTypeRecord = record.load({ type: record.Type.UNITS_TYPE, id: unitTypeId });
                                    var lineCount = unitTypeRecord.getLineCount({ sublistId: 'uom' });
    
                                    for (var j = 0; j < lineCount; j++) {
                                        var abbreviation = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'abbreviation', line: j });
                                        var baseUnit = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'baseunit', line: j });
                                        var conversionRate = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'conversionrate', line: j });
    
                                        if (abbreviation) {
                                            abbreviation = abbreviation.toLowerCase();
                                            uomConversionRates[abbreviation] = parseFloat(conversionRate) || 1;
                                        }
    
                                        if (baseUnit === true) { // Fix for base unit check
                                            baseUnitAbbreviation = abbreviation;
                                        }
                                    }
                                }
    
                                var itemData = {
                                    documentNo: 'T1259523F',
                                    type: 'double a notebook',
                                    unitstype: result.getText({ name: 'unitstype' }),
                                    product: result.getValue({ name: 'itemid' }),
                                    internalId: result.getValue({ name: 'internalid' }),
                                    displayName: result.getValue({ name: 'displayname' }),
                                    pallet: (parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0) > 0 &&
                                            parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0) > 0) ? 'true' : 'false',
                                    layer: result.getText({ name: 'custitem_infor_layer' }) || 'N/A',
                                    length: parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0),
                                    width: parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0),
                                    height: parseFloat(result.getValue({ name: 'custitem_infor_pallet_height_inch' }) || 0),
                                    weight: parseFloat(weight || 0),
                                    netWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_std_net_weight' }) || 0),
                                    grossWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_gross_weight' }) || 0),
                                    maxWeightTon: weight, // Capture from JSON
                                    baseUnitAbbreviation: qtyUOM || baseUnitAbbreviation,
                                    binDAN: binDAN,
                                    uomConversionRates: uomConversionRates
                                };
    
                                var parentKey = parent + " - " + weight + baseUnitAbbreviation;
                                if (!boxesDAN[parentKey]) {
                                    boxesDAN[parentKey] = [];
                                }
                                boxesDAN[parentKey].push(itemData);
                            });
                        }
                        log.debug('boxesDAN', boxesDAN);
    
                    } 
    
                    if (productTypeName && productTypeName.toLowerCase().includes('double a office supply')) {
    
                        jsonDataDAOS = jsonData.items;
                        var productId = jsonDataDAOS[i].custpage_product.id;
                        var weight = jsonDataDAOS[i].custpage_quantity;
                        var containerId = jsonDataDAOS[i].custpage_container.id;
    
                        // Load container details
                        var containerRec = record.load({
                            type: 'customrecord_exp_containerssize',
                            id: containerId
                        }); 
                        
                        var binDAOS = {
                            size: containerRec.getText('name') || null,
                            length: parseFloat(containerRec.getValue('custrecord_con_dimensionlength')) || 0,
                            width: parseFloat(containerRec.getValue('custrecord_con_dimensionwide')) || 0,
                            height: parseFloat(containerRec.getValue('custrecord_con_dimensionheight')) || 0,
                            maxWeight: parseFloat(containerRec.getValue('custrecord_con_maxweight'))/1000 || 0
                        };
    
                        // Load item details
                        var itemType = search.lookupFields({
                            type: search.Type.ITEM,
                            id: productId,
                            columns: ['recordtype']
                        }).recordtype;
    
                        var itemRecord = record.load({ type: itemType, id: productId });
                        var parent = itemRecord.getValue({ fieldId: 'displayname' });
    
                        var itemSearch = search.create({
                            type: itemType,
                            filters: [
                                ['internalid', 'anyof', productId],
                                'AND',
                                ['custitem_infor_pallet_type', 'anyof', customerPallet]
                            ],
                            columns: [
                                'internalid', 'displayname', 'itemid', 'unitstype',
                                'custitem_infor_pallet_wide_inch', 'custitem_infor_pallet_length_inch',
                                'custitem_infor_pallet_height_inch', 'custitem_infor_std_net_weight',
                                'custitem_infor_gross_weight', 'custitem_infor_layer'
                            ]
                        });
    
                        var searchResult = itemSearch.run().getRange({ start: 0, end: 1000 }) || [];
    
                        if (searchResult.length > 0) {
                            searchResult.forEach(function (result) {
                                var unitTypeId = result.getValue({ name: 'unitstype' });
                                var uomConversionRates = {};
                                var baseUnitAbbreviation = '';
    
                                if (unitTypeId) {
                                    var unitTypeRecord = record.load({ type: record.Type.UNITS_TYPE, id: unitTypeId });
                                    var lineCount = unitTypeRecord.getLineCount({ sublistId: 'uom' });
    
                                    for (var j = 0; j < lineCount; j++) {
                                        var abbreviation = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'abbreviation', line: j });
                                        var baseUnit = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'baseunit', line: j });
                                        var conversionRate = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'conversionrate', line: j });
    
                                        if (abbreviation) {
                                            abbreviation = abbreviation.toLowerCase();
                                            uomConversionRates[abbreviation] = parseFloat(conversionRate) || 1;
                                        }
    
                                        if (baseUnit === true) { // Fix for base unit check
                                            baseUnitAbbreviation = abbreviation;
                                        }
                                    }
                                }
    
                                var itemData = {
                                    documentNo: 'T1259523F',
                                    type: 'double a office supply',
                                    unitstype: result.getText({ name: 'unitstype' }),
                                    product: result.getValue({ name: 'itemid' }),
                                    internalId: result.getValue({ name: 'internalid' }),
                                    displayName: result.getValue({ name: 'displayname' }),
                                    pallet: (parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0) > 0 &&
                                            parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0) > 0) ? 'true' : 'false',
                                    layer: result.getText({ name: 'custitem_infor_layer' }) || 'N/A',
                                    length: parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0),
                                    width: parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0),
                                    height: parseFloat(result.getValue({ name: 'custitem_infor_pallet_height_inch' }) || 0),
                                    weight: parseFloat(weight || 0),
                                    netWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_std_net_weight' }) || 0),
                                    grossWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_gross_weight' }) || 0),
                                    maxWeightTon: weight, // Capture from JSON
                                    baseUnitAbbreviation: qtyUOM || baseUnitAbbreviation,
                                    binDAOS: binDAOS,
                                    uomConversionRates: uomConversionRates
                                };
    
                                var parentKey = parent + " - " + weight + baseUnitAbbreviation;
                                if (!boxesDAOS[parentKey]) {
                                    boxesDAOS[parentKey] = [];
                                }
                                boxesDAOS[parentKey].push(itemData);
                            });
                        }
                        log.debug('boxesDAOS', boxesDAOS);
    
                    }
    
                    if (productTypeName && productTypeName.toLowerCase().includes('double a colour paper')) {
    
                        jsonDataDACP = jsonData.items;
                        var productId = jsonDataDACP[i].custpage_product.id;
                        var weight = jsonDataDACP[i].custpage_quantity;
                        var containerId = jsonDataDACP[i].custpage_container.id;
    
                        // Load container details
                        var containerRec = record.load({
                            type: 'customrecord_exp_containerssize',
                            id: containerId
                        }); 
                        
                        var binDACP = {
                            size: containerRec.getText('name') || null,
                            length: parseFloat(containerRec.getValue('custrecord_con_dimensionlength')) || 0,
                            width: parseFloat(containerRec.getValue('custrecord_con_dimensionwide')) || 0,
                            height: parseFloat(containerRec.getValue('custrecord_con_dimensionheight')) || 0,
                            maxWeight: parseFloat(containerRec.getValue('custrecord_con_maxweight'))/1000 || 0
                        };
                        
                        // Load item details
                        var itemType = search.lookupFields({
                            type: search.Type.ITEM,
                            id: productId,
                            columns: ['recordtype']
                        }).recordtype;
    
                        var itemRecord = record.load({ type: itemType, id: productId });
                        var parent = itemRecord.getValue({ fieldId: 'displayname' });
                    
                        var itemSearch = search.create({
                            type: itemType,
                            filters: [
                                ['internalid', 'anyof', productId],
                                'AND',
                                ['custitem_infor_pallet_type', 'anyof', customerPallet]
                            ],
                            columns: [
                                'internalid', 'displayname', 'itemid', 'unitstype',
                                'custitem_infor_pallet_wide_inch', 'custitem_infor_pallet_length_inch',
                                'custitem_infor_pallet_height_inch', 'custitem_infor_std_net_weight',
                                'custitem_infor_gross_weight', 'custitem_infor_layer',
                            ]
                        });
                    
                        var searchResult = itemSearch.run().getRange({ start: 0, end: 1000 }) || [];
                    
                        if (searchResult.length > 0) {
                            searchResult.forEach(function (result) {
                                var unitTypeId = result.getValue({ name: 'unitstype' });
                                var uomConversionRates = {};
                                var baseUnitAbbreviation = '';
                    
                                if (unitTypeId) {
                                    var unitTypeRecord = record.load({ type: record.Type.UNITS_TYPE, id: unitTypeId });
                                    var lineCount = unitTypeRecord.getLineCount({ sublistId: 'uom' });
                    
                                    for (var j = 0; j < lineCount; j++) {
                                        var abbreviation = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'abbreviation', line: j });
                                        var baseUnit = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'baseunit', line: j });
                                        var conversionRate = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'conversionrate', line: j });
                    
                                        if (abbreviation) {
                                            abbreviation = abbreviation.toLowerCase();
                                            uomConversionRates[abbreviation] = parseFloat(conversionRate) || 1;
                                        }
        
                                        if (baseUnit === true) { // Fix for base unit check
                                            baseUnitAbbreviation = abbreviation;
                                        }
                                    }
                                }
                    
                                var itemData = {
                                    documentNo: 'A0108224Z',
                                    type: 'double a colour paper',
                                    unitstype: result.getText({ name: 'unitstype' }),
                                    product: result.getValue({ name: 'itemid' }),
                                    internalId: result.getValue({ name: 'internalid' }),
                                    displayName: result.getValue({ name: 'displayname' }),
                                    pallet: (parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0) > 0 &&
                                            parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0) > 0) ? 'true' : 'false',
                                    layer: result.getText({ name: 'custitem_infor_layer' }) || 'N/A',
                                    length: parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0),
                                    width: parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0),
                                    height: parseFloat(result.getValue({ name: 'custitem_infor_pallet_height_inch' }) || 0),
                                    weight: parseFloat(weight || 0),
                                    netWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_std_net_weight' }) || 0),
                                    grossWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_gross_weight' }) || 0),
                                    maxWeightTon: weight, // Capture from JSON
                                    baseUnitAbbreviation: qtyUOM || baseUnitAbbreviation,
                                    binDACP: binDACP,
                                    uomConversionRates: uomConversionRates,
                                };
                    
                                var parentKey = parent + " - " + weight + baseUnitAbbreviation;
                                if (!boxesDACP[parentKey]) {
                                    boxesDACP[parentKey] = [];
                                }
                                boxesDACP[parentKey].push(itemData);
                            });
                        }
                    } 
    
                    if (productTypeName && productTypeName.toLowerCase().includes('corrugating medium paper (sheet)')) {
    
                        jsonDataCMSheet = jsonData.items;
                        var productId = jsonDataCMSheet[i].custpage_product.id;
                        var weight = jsonDataCMSheet[i].custpage_quantity;
                        var containerId = jsonDataCMSheet[i].custpage_container.id;
    
                        // Load container details
                        var containerRec = record.load({
                            type: 'customrecord_exp_containerssize',
                            id: containerId
                        }); 
                        
                        var binCMSheet = {
                            size: containerRec.getText('name') || null,
                            length: parseFloat(containerRec.getValue('custrecord_con_dimensionlength')) || 0,
                            width: parseFloat(containerRec.getValue('custrecord_con_dimensionwide')) || 0,
                            height: parseFloat(containerRec.getValue('custrecord_con_dimensionheight')) || 0,
                            maxWeight: parseFloat(containerRec.getValue('custrecord_con_maxweight'))/1000 || 0
                        };
    
                        // Load item details
                        var itemType = search.lookupFields({
                            type: search.Type.ITEM,
                            id: productId,
                            columns: ['recordtype']
                        }).recordtype;
    
                        var itemRecord = record.load({ type: itemType, id: productId });
                        var parent = itemRecord.getValue({ fieldId: 'displayname' });
    
                        var itemSearch = search.create({
                            type: itemType,
                            filters: [
                                ['internalid', 'anyof', productId],
                                'AND',
                                ['custitem_infor_pallet_type', 'anyof', customerPallet]
                            ],
                            columns: [
                                'internalid', 'displayname', 'itemid', 'unitstype',
                                'custitem_infor_pallet_wide_inch', 'custitem_infor_pallet_length_inch',
                                'custitem_infor_pallet_height_inch', 'custitem_infor_std_net_weight',
                                'custitem_infor_gross_weight', 'custitem_infor_layer'
                            ]
                        });
    
                        var searchResult = itemSearch.run().getRange({ start: 0, end: 1000 }) || [];
    
                        if (searchResult.length > 0) {
                            searchResult.forEach(function (result) {
                                var unitTypeId = result.getValue({ name: 'unitstype' });
                                var uomConversionRates = {};
                                var baseUnitAbbreviation = '';
    
                                if (unitTypeId) {
                                    var unitTypeRecord = record.load({ type: record.Type.UNITS_TYPE, id: unitTypeId });
                                    var lineCount = unitTypeRecord.getLineCount({ sublistId: 'uom' });
    
                                    for (var j = 0; j < lineCount; j++) {
                                        var abbreviation = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'abbreviation', line: j });
                                        var baseUnit = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'baseunit', line: j });
                                        var conversionRate = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'conversionrate', line: j });
    
                                        if (abbreviation) {
                                            abbreviation = abbreviation.toLowerCase();
                                            uomConversionRates[abbreviation] = parseFloat(conversionRate) || 1;
                                        }
    
                                        if (baseUnit === true) { // Fix for base unit check
                                            baseUnitAbbreviation = abbreviation;
                                        }
                                    }
                                }
    
                                var itemData = {
                                    documentNo: 'T1259523F',
                                    type: 'CM Sheet',
                                    unitstype: result.getText({ name: 'unitstype' }),
                                    product: result.getValue({ name: 'itemid' }),
                                    internalId: result.getValue({ name: 'internalid' }),
                                    displayName: result.getValue({ name: 'displayname' }),
                                    pallet: (parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0) > 0 &&
                                            parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0) > 0) ? 'true' : 'false',
                                    layer: result.getText({ name: 'custitem_infor_layer' }) || 'N/A',
                                    length: parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0),
                                    width: parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0),
                                    height: parseFloat(result.getValue({ name: 'custitem_infor_pallet_height_inch' }) || 0),
                                    weight: parseFloat(weight || 0),
                                    netWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_std_net_weight' }) || 0),
                                    grossWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_gross_weight' }) || 0),
                                    maxWeightTon: weight, // Capture from JSON
                                    baseUnitAbbreviation: qtyUOM || baseUnitAbbreviation,
                                    binCMSheet: binCMSheet,
                                    uomConversionRates: uomConversionRates
                                };
    
                                var parentKey = parent + " - " + weight + baseUnitAbbreviation;
                                if (!boxesCMSheet[parentKey]) {
                                    boxesCMSheet[parentKey] = [];
                                }
                                boxesCMSheet[parentKey].push(itemData);
                            });
                        }
                        log.debug('boxesCMSheet', boxesCMSheet);
    
                    } 
    
                    if (productTypeName && productTypeName.toLowerCase().includes('wrapper'))
                    {
                    
                        jsonDataWrapper = jsonData.items;
                        var productId = jsonDataWrapper[i].custpage_product.id;
                        var weight = jsonDataWrapper[i].custpage_quantity;
                        var containerId = jsonDataWrapper[i].custpage_container.id;
    
                        // Load container details
                        var containerRec = record.load({
                            type: 'customrecord_exp_containerssize',
                            id: containerId
                        }); 
                        
                        var binWrapper = {
                            size: containerRec.getText('name') || null,
                            length: parseFloat(containerRec.getValue('custrecord_con_dimensionlength')) || 0,
                            width: parseFloat(containerRec.getValue('custrecord_con_dimensionwide')) || 0,
                            height: parseFloat(containerRec.getValue('custrecord_con_dimensionheight')) || 0,
                            maxWeight: parseFloat(containerRec.getValue('custrecord_con_maxweight'))/1000 || 0
                        };
    
                        // Load item details
                        var itemType = search.lookupFields({
                            type: search.Type.ITEM,
                            id: productId,
                            columns: ['recordtype']
                        }).recordtype;
    
                        var itemRecord = record.load({ type: itemType, id: productId });
                        var parent = itemRecord.getValue({ fieldId: 'displayname' });
    
                        var itemSearch = search.create({
                            type: itemType,
                            filters: [
                                ['internalid', 'anyof', productId],
                                'AND',
                                ['custitem_infor_pallet_type', 'anyof', customerPallet]
                            ],
                            columns: [
                                'internalid',
                                'displayname',
                                'itemid',
                                'unitstype',
                                'cseg_item_sub_group',
                                'custitem_infor_std_net_weight',
                                'custitem_infor_gross_weight',
                                'custitem_infor_diameter_mm',
                                'custitem_infor_width_mm',
                                'custitem_infor_core',
                            ]
                        });
    
                        var searchResult = itemSearch.run().getRange({ start: 0, end: 1000 }) || [];
    
                        if (searchResult.length > 0) {
                            searchResult.forEach(function (result) {
                                var unitTypeId = result.getValue({ name: 'unitstype' });
                                var uomConversionRates = {};
                                var baseUnitAbbreviation = '';
    
                                if (unitTypeId) {
                                    var unitTypeRecord = record.load({ type: record.Type.UNITS_TYPE, id: unitTypeId });
                                    var lineCount = unitTypeRecord.getLineCount({ sublistId: 'uom' });
    
                                    for (var j = 0; j < lineCount; j++) {
                                        var abbreviation = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'abbreviation', line: j });
                                        var baseUnit = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'baseunit', line: j });
                                        var conversionRate = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'conversionrate', line: j });
    
                                        if (abbreviation) {
                                            abbreviation = abbreviation.toLowerCase();
                                            uomConversionRates[abbreviation] = parseFloat(conversionRate) || 1;
                                        }
    
                                        if (baseUnit === true) { // Fix for base unit check
                                            baseUnitAbbreviation = abbreviation;
                                        }
                                    }
                                }
    
                                var itemData = {
                                    documentNo: 'T0373524R',
                                    type: 'wrapper',
                                    unitstype: result.getText({ name: 'unitstype' }),
                                    product: result.getValue({ name: 'itemid' }),
                                    internalId: result.getValue({ name: 'internalId' }),
                                    displayName: result.getValue({ name: 'displayname' }),
                                    weight: parseFloat(weight || 0),
                                    netWeightPerWrapper: parseFloat(result.getValue({ name: 'custitem_infor_std_net_weight' }) || 0),
                                    grossWeightPerWrapper: parseFloat(result.getValue({ name: 'custitem_infor_gross_weight' }) || 0),
                                    maxWeightTon: weight,
                                    baseUnitAbbreviation: qtyUOM || baseUnitAbbreviation,
                                    diameter: result.getText({ name: 'custitem_infor_diameter_mm' }),
                                    width: result.getValue({ name: 'custitem_infor_width_mm' }),
                                    core: result.getText({ name: 'custitem_infor_core' }),
                                    binWrapper: binWrapper,
                                    uomConversionRates: uomConversionRates
                                };
    
                                var parentKey = parent + " - " + weight + baseUnitAbbreviation;
                                if (!boxesWrapper[parentKey]) {
                                    boxesWrapper[parentKey] = [];
                                }
                                boxesWrapper[parentKey].push(itemData);
                            });
                        }
                        log.debug('boxesWrapper', boxesWrapper);
                    
                    }
    
                    if (
                        (productTypeName && productTypeName.toLowerCase().includes('corrugating medium paper (roll)'))
                    ) {
                    
                        jsonDataCMRoll = jsonData.items;
                        var productId = jsonDataCMRoll[i].custpage_product.id;
                        var weight = jsonDataCMRoll[i].custpage_quantity;
                        var containerId = jsonDataCMRoll[i].custpage_container.id;
    
                        // Load container details
                        var containerRec = record.load({
                            type: 'customrecord_exp_containerssize',
                            id: containerId
                        }); 
                        
                        var binCMRoll = {
                            size: containerRec.getText('name') || null,
                            length: parseFloat(containerRec.getValue('custrecord_con_dimensionlength')) || 0,
                            width: parseFloat(containerRec.getValue('custrecord_con_dimensionwide')) || 0,
                            height: parseFloat(containerRec.getValue('custrecord_con_dimensionheight')) || 0,
                            maxWeight: parseFloat(containerRec.getValue('custrecord_con_maxweight'))/1000 || 0
                        };
    
                        // Load item details
                        var itemType = search.lookupFields({
                            type: search.Type.ITEM,
                            id: productId,
                            columns: ['recordtype']
                        }).recordtype;
    
                        var itemRecord = record.load({ type: itemType, id: productId });
                        var parent = itemRecord.getValue({ fieldId: 'displayname' });
    
                        var itemSearch = search.create({
                            type: itemType,
                            filters: ['internalid', 'anyof', productId],
                            columns: [
                                'internalid',
                                'displayname',
                                'itemid',
                                'unitstype',
                                'cseg_item_sub_group',
                                'custitem_infor_std_net_weight',
                                'custitem_infor_gross_weight',
                                'custitem_infor_diameter_mm',
                                'custitem_infor_width_mm',
                                'custitem_infor_core',
                            ]
                        });
    
                        var searchResult = itemSearch.run().getRange({ start: 0, end: 1000 }) || [];
    
                        if (searchResult.length > 0) {
                            searchResult.forEach(function (result) {
                                var unitTypeId = result.getValue({ name: 'unitstype' });
                                var uomConversionRates = {};
                                var baseUnitAbbreviation = '';
    
                                if (unitTypeId) {
                                    var unitTypeRecord = record.load({ type: record.Type.UNITS_TYPE, id: unitTypeId });
                                    var lineCount = unitTypeRecord.getLineCount({ sublistId: 'uom' });
    
                                    for (var j = 0; j < lineCount; j++) {
                                        var abbreviation = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'abbreviation', line: j });
                                        var baseUnit = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'baseunit', line: j });
                                        var conversionRate = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'conversionrate', line: j });
    
                                        if (abbreviation) {
                                            abbreviation = abbreviation.toLowerCase();
                                            uomConversionRates[abbreviation] = parseFloat(conversionRate) || 1;
                                        }
    
                                        if (baseUnit === true) { // Fix for base unit check
                                            baseUnitAbbreviation = abbreviation;
                                        }
                                    }
                                }
    
                                var itemData = {
                                    documentNo: 'T0373524R',
                                    type: 'CM Roll',
                                    unitstype: result.getText({ name: 'unitstype' }),
                                    product: result.getValue({ name: 'itemid' }),
                                    internalId: result.getValue({ name: 'internalId' }),
                                    displayName: result.getValue({ name: 'displayname' }),
                                    weight: parseFloat(weight || 0),
                                    netWeightPerCMRoll: parseFloat(result.getValue({ name: 'custitem_infor_std_net_weight' }) || 0),
                                    grossWeightPerCMRoll: parseFloat(result.getValue({ name: 'custitem_infor_gross_weight' }) || 0),
                                    maxWeightTon: weight,
                                    baseUnitAbbreviation: qtyUOM || baseUnitAbbreviation,
                                    diameter: result.getText({ name: 'custitem_infor_diameter_mm' }),
                                    width: result.getValue({ name: 'custitem_infor_width_mm' }),
                                    core: result.getText({ name: 'custitem_infor_core' }),
                                    binCMRoll: binCMRoll,
                                    uomConversionRates: uomConversionRates
                                };
    
                                var parentKey = parent + " - " + weight + baseUnitAbbreviation;
                                if (!boxesCMRoll[parentKey]) {
                                    boxesCMRoll[parentKey] = [];
                                }
                                boxesCMRoll[parentKey].push(itemData);
                            });
                        }
                        log.debug('boxesCMRoll', boxesCMRoll);
                    
                    }
    
                    if (
                        (
                            (productTypeName && productTypeName.toLowerCase().includes('roll')) ||
                            (displayName && displayName.toLowerCase().includes('width'))
                        ) &&
                        (!productTypeName || !productTypeName.toLowerCase().includes('corrugating medium paper (roll)'))
                        &&
                        (!productTypeName || !productTypeName.toLowerCase().includes('honeycomb'))
                    )
                     {
                    
                        jsonDataRoll = jsonData.items;
                        var productId = jsonDataRoll[i].custpage_product.id;
                        var weight = jsonDataRoll[i].custpage_quantity;
                        var containerId = jsonDataRoll[i].custpage_container.id;
    
                        // Load container details
                        var containerRec = record.load({
                            type: 'customrecord_exp_containerssize',
                            id: containerId
                        }); 
                        
                        var binRoll = {
                            size: containerRec.getText('name') || null,
                            length: parseFloat(containerRec.getValue('custrecord_con_dimensionlength')) || 0,
                            width: parseFloat(containerRec.getValue('custrecord_con_dimensionwide')) || 0,
                            height: parseFloat(containerRec.getValue('custrecord_con_dimensionheight')) || 0,
                            maxWeight: parseFloat(containerRec.getValue('custrecord_con_maxweight'))/1000 || 0
                        };
    
                        // Load item details
                        var itemType = search.lookupFields({
                            type: search.Type.ITEM,
                            id: productId,
                            columns: ['recordtype']
                        }).recordtype;
    
                        var itemRecord = record.load({ type: itemType, id: productId });
                        var parent = itemRecord.getValue({ fieldId: 'displayname' });
    
                        var itemSearch = search.create({
                            type: itemType,
                            filters: ['internalid', 'anyof', productId],
                            columns: [
                                'internalid',
                                'displayname',
                                'itemid',
                                'unitstype',
                                'cseg_item_sub_group',
                                'custitem_infor_std_net_weight',
                                'custitem_infor_gross_weight',
                                'custitem_infor_diameter_mm',
                                'custitem_infor_width_mm',
                                'custitem_infor_core',
                            ]
                        });
    
                        var searchResult = itemSearch.run().getRange({ start: 0, end: 1000 }) || [];
    
                        if (searchResult.length > 0) {
                            searchResult.forEach(function (result) {
                                var unitTypeId = result.getValue({ name: 'unitstype' });
                                var uomConversionRates = {};
                                var baseUnitAbbreviation = '';
    
                                if (unitTypeId) {
                                    var unitTypeRecord = record.load({ type: record.Type.UNITS_TYPE, id: unitTypeId });
                                    var lineCount = unitTypeRecord.getLineCount({ sublistId: 'uom' });
    
                                    for (var j = 0; j < lineCount; j++) {
                                        var abbreviation = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'abbreviation', line: j });
                                        var baseUnit = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'baseunit', line: j });
                                        var conversionRate = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'conversionrate', line: j });
    
                                        if (abbreviation) {
                                            abbreviation = abbreviation.toLowerCase();
                                            uomConversionRates[abbreviation] = parseFloat(conversionRate) || 1;
                                        }
    
                                        if (baseUnit === true) { // Fix for base unit check
                                            baseUnitAbbreviation = abbreviation;
                                        }
                                    }
                                }
    
                                var itemData = {
                                    documentNo: 'T0373524R',
                                    type: 'roll',
                                    unitstype: result.getText({ name: 'unitstype' }),
                                    product: result.getValue({ name: 'itemid' }),
                                    internalId: result.getValue({ name: 'internalId' }),
                                    displayName: result.getValue({ name: 'displayname' }),
                                    weight: parseFloat(weight || 0),
                                    netWeightPerRoll: parseFloat(result.getValue({ name: 'custitem_infor_std_net_weight' }) || 0),
                                    grossWeightPerRoll: parseFloat(result.getValue({ name: 'custitem_infor_gross_weight' }) || 0),
                                    maxWeightTon: weight,
                                    baseUnitAbbreviation: qtyUOM || baseUnitAbbreviation,
                                    diameter: result.getText({ name: 'custitem_infor_diameter_mm' }),
                                    width: result.getValue({ name: 'custitem_infor_width_mm' }),
                                    core: result.getText({ name: 'custitem_infor_core' }),
                                    binRoll: binRoll,
                                    uomConversionRates: uomConversionRates
                                };
    
                                var parentKey = parent + " - " + weight + baseUnitAbbreviation;
                                if (!boxesRoll[parentKey]) {
                                    boxesRoll[parentKey] = [];
                                }
                                boxesRoll[parentKey].push(itemData);
                            });
                        }
                        log.debug('boxesroll', boxesRoll);
                    
                    }
                }  
            }
        } else {
            log.debug('no data received!');
        }

        if (jsonData.freeGifts) {
            for (var i = 0; i < jsonData.freeGifts.length; i++) {

                var itemId = jsonData.freeGifts[i].custpage_product.id;

                // First, get the item type using search.lookupFields
                var itemType = search.lookupFields({
                    type: 'item',
                    id: itemId,
                    columns: ['recordtype']
                }).recordtype;

                // Now load the item using the retrieved type
                var productTypeID = record.load({
                    type: itemType,
                    id: itemId
                }).getValue('custitem_infor_sca_itemsubtype');

                var productTypeName = null
                if (productTypeID){
                    var productTypeName = record.load({
                        type: 'customrecord_sca_itemsubtype_mappinglist',
                        id: productTypeID
                    }).getValue('name');
                }
                
                var displayName = record.load({
                    type: itemType,
                    id: itemId
                }).getValue('displayname');
                
                jsonDataFreeGifts = jsonData.freeGifts;
                var productId = jsonDataFreeGifts[i].custpage_product.id;
                var weight = jsonDataFreeGifts[i].custpage_quantity;
                var containerId = jsonDataFreeGifts[i].custpage_container.id;

                // Load container details
                var containerRec = record.load({
                    type: 'customrecord_exp_containerssize',
                    id: containerId
                }); 
                
                var bin = {
                    size: containerRec.getText('name') || null,
                    length: parseFloat(containerRec.getValue('custrecord_con_dimensionlength')) || 0,
                    width: parseFloat(containerRec.getValue('custrecord_con_dimensionwide')) || 0,
                    height: parseFloat(containerRec.getValue('custrecord_con_dimensionheight')) || 0,
                    maxWeight: parseFloat(containerRec.getValue('custrecord_con_maxweight'))/1000 || 0
                };

                // Load item details
                var itemType = search.lookupFields({
                    type: search.Type.ITEM,
                    id: productId,
                    columns: ['recordtype']
                }).recordtype;

                var itemRecord = record.load({ type: itemType, id: productId });
                var parent = itemRecord.getValue({ fieldId: 'displayname' });
            
                if (productTypeName && productTypeName.toLowerCase().includes('copy paper')){
                    var itemSearch = search.create({
                        type: itemType,
                        filters: [
                            ['parent', 'anyof', productId],
                            'AND',
                            ['custitem_infor_pallet_type', 'anyof', customerPallet]
                        ],
                        columns: [
                            'internalid', 'displayname', 'itemid', 'unitstype',
                            'custitem_infor_pallet_wide_inch', 'custitem_infor_pallet_length_inch',
                            'custitem_infor_pallet_height_inch', 'custitem_infor_std_net_weight',
                            'custitem_infor_gross_weight', 'custitem_infor_layer',
                        ]
                    });
                }  else if ((productTypeName && productTypeName.toLowerCase().includes('corrugating medium paper (roll)'))){

                    var itemSearch = search.create({
                        type: itemType,
                        filters: ['internalid', 'anyof', productId],
                        columns: [
                            'internalid',
                            'displayname',
                            'itemid',
                            'unitstype',
                            'cseg_item_sub_group',
                            'custitem_infor_std_net_weight',
                            'custitem_infor_gross_weight',
                            'custitem_infor_diameter_mm',
                            'custitem_infor_width_mm',
                            'custitem_infor_core',
                        ]
                    });

                } else if (
                    (
                        (productTypeName && productTypeName.toLowerCase().includes('roll')) ||
                        (displayName && displayName.toLowerCase().includes('width'))
                    ) &&
                    (!productTypeName || !productTypeName.toLowerCase().includes('corrugating medium paper (roll)'))
                    &&
                    (!productTypeName || !productTypeName.toLowerCase().includes('honeycomb'))
                ){

                    var itemSearch = search.create({
                        type: itemType,
                        filters: ['internalid', 'anyof', productId],
                        columns: [
                            'internalid',
                            'displayname',
                            'itemid',
                            'unitstype',
                            'cseg_item_sub_group',
                            'custitem_infor_std_net_weight',
                            'custitem_infor_gross_weight',
                            'custitem_infor_diameter_mm',
                            'custitem_infor_width_mm',
                            'custitem_infor_core',
                        ]
                    });

                } else {
                    var itemSearch = search.create({
                        type: itemType,
                        filters: [
                            ['internalid', 'anyof', productId],
                            'AND',
                            ['custitem_infor_pallet_type', 'anyof', customerPallet]
                        ],
                        columns: [
                            'internalid', 'displayname', 'itemid', 'unitstype',
                            'custitem_infor_pallet_wide_inch', 'custitem_infor_pallet_length_inch',
                            'custitem_infor_pallet_height_inch', 'custitem_infor_std_net_weight',
                            'custitem_infor_gross_weight', 'custitem_infor_layer',
                        ]
                    });
                }
            
                var searchResult = itemSearch.run().getRange({ start: 0, end: 1000 }) || [];
            
                if (searchResult.length > 0) {
                    searchResult.forEach(function (result) {
                        var unitTypeId = result.getValue({ name: 'unitstype' });
                        var uomConversionRates = {};
                        var baseUnitAbbreviation = '';
            
                        if (unitTypeId) {
                            var unitTypeRecord = record.load({ type: record.Type.UNITS_TYPE, id: unitTypeId });
                            var lineCount = unitTypeRecord.getLineCount({ sublistId: 'uom' });
            
                            for (var j = 0; j < lineCount; j++) {
                                var abbreviation = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'abbreviation', line: j });
                                var baseUnit = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'baseunit', line: j });
                                var conversionRate = unitTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'conversionrate', line: j });
            
                                if (abbreviation) {
                                    abbreviation = abbreviation.toLowerCase();
                                    uomConversionRates[abbreviation] = parseFloat(conversionRate) || 1;
                                }

                                if (baseUnit === true) { // Fix for base unit check
                                    baseUnitAbbreviation = abbreviation;
                                }
                            }
                        }
            
                        var itemData = {
                            documentNo: 'A0108224Z',
                            type: 'free gift',
                            unitstype: result.getText({ name: 'unitstype' }),
                            product: result.getValue({ name: 'itemid' }),
                            internalId: result.getValue({ name: 'internalid' }),
                            displayName: result.getValue({ name: 'displayname' }),
                            pallet: (parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0) > 0 &&
                                    parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0) > 0) ? 'true' : 'false',
                            layer: result.getText({ name: 'custitem_infor_layer' }) || 'N/A',
                            length: parseFloat(result.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0),
                            width: parseFloat(result.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0),
                            height: parseFloat(result.getValue({ name: 'custitem_infor_pallet_height_inch' }) || 0),
                            weight: parseFloat(weight || 0),
                            netWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_std_net_weight' }) || 0),
                            grossWeightPerPallet: parseFloat(result.getValue({ name: 'custitem_infor_gross_weight' }) || 0),
                            maxWeightTon: weight, // Capture from JSON
                            baseUnitAbbreviation: baseUnitAbbreviation,
                            bin: bin,
                            uomConversionRates: uomConversionRates,

                        };
            
                        var parentKey = parent + " - " + weight + baseUnitAbbreviation;
                        if (!freeGifts[parentKey]) {
                            freeGifts[parentKey] = [];
                        }
                        freeGifts[parentKey].push(itemData);
                    });
                }
            }
        }

        if (jsonData.selectedOption) {
            selectedOption = jsonData.selectedOption;
        }

        // Targeted Suitelet URL
        var suitelet2 = 'https://8158655.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1907&deploy=1&compid=8158655&ns-at=AAEJ7tMQKPpOUgMFE0eHmj_qWpombdOocuAG-gpd4muqON9iT6o';
        var suitelet3 = 'https://8158655.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1693&deploy=1&compid=8158655&ns-at=AAEJ7tMQuDL0qZx_sUKJpUu0z6TuDn2Zx_BpEVeoSzRxzfKidLk';
        // var suitelet3 = 'https://8158655-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1693&deploy=1&compid=8158655_SB1&ns-at=AAEJ7tMQ4a8l3VQ7eg-36lfntXmfSwliX3LIy92_K_NwFkiyCKA';

        var action = jsonData.action || 'viewContainerList';
        // Prepare the data payloadToSuitelet3
        var payloadToSuitelet2  = {
            action: action,
            freeGifts: freeGifts,
            // selectedOption: [
            //     {
            //         "custpage_product": { "id": "3834" },
            //         "custpage_quantity": 3
            //     }
            // ],
            // selectedStatus: "adjustedQty",
            // boxesCutsize: {
            //     "Double A (China) 70G A4 (500) - 2000kg": [
            //       {
            //         "documentNo": "A0108224Z",
            //         "type": "cutsize",
            //         "unitstype": "1CZE-DN-070-A04-500-4L-003",
            //         "product": "1CZE-DC-070-A04-500-001 : 1CZE-DC-070-A04-500-4L-B21-001",
            //         "internalId": "3836",
            //         "displayName": "Double A (China) 70G A4 (500) CZ2 4L 300R/P N",
            //         "pallet": "true",
            //         "layer": "4L",
            //         "length": 45,
            //         "width": 37,
            //         "height": 44.88,
            //         "weight": 1000,
            //         "netWeightPerPallet": 654.885,
            //         "grossWeightPerPallet": 700.72695,
            //         "maxWeightTon": 1000,
            //         "baseUnitAbbreviation": "kg",
            //         "binCutsize": {
            //           "size": "20'",
            //           "length": 228,
            //           "width": 90,
            //           "height": 90,
            //           "maxWeight": 2.7,
            //         },
            //         "uomConversionRates": {
            //           "kg": 1,
            //           "ream": 2.183,
            //           "box": 10.9148,
            //           "pallet": 654.885,
            //           "ton": 1000
            //         }
            //       },
            //       {
            //         "documentNo": "A0108224Z",
            //         "type": "cutsize",
            //         "unitstype": "1CZE-DN-070-A04-500-4L-004",
            //         "product": "1CZE-DC-070-A04-500-001 : 1CZE-DC-070-A04-500-4L-B23-001",
            //         "internalId": "3837",
            //         "displayName": "Double A (China) 70G A4 (500) CZ2 4L 300R/P SS",
            //         "pallet": "true",
            //         "layer": "4L",
            //         "length": 46.06,
            //         "width": 41.73,
            //         "height": 39.37,
            //         "weight": 1000,
            //         "netWeightPerPallet": 654.885,
            //         "grossWeightPerPallet": 700.72695,
            //         "maxWeightTon": 1000,
            //         "baseUnitAbbreviation": "kg",
            //         "binCutsize": {
            //           "size": "20'",
            //           "length": 228,
            //           "width": 90,
            //           "height": 90,
            //           "maxWeight": 2.7,
            //         },
            //         "uomConversionRates": {
            //           "kg": 1,
            //           "ream": 2.183,
            //           "box": 10.9148,
            //           "pallet": 654.885,
            //           "ton": 1000
            //         }
            //       },
            //       {
            //         "documentNo": "A0108224Z",
            //         "type": "cutsize",
            //         "unitstype": "1CZE-DN-070-A04-500-4L-001",
            //         "product": "1CZE-DC-070-A04-500-001 : 1CZE-DN-070-A04-500-4L-001",
            //         "internalId": "3834",
            //         "displayName": "Double A (China) 70G A4 (500) AUTO 4L 300R/P N",
            //         "pallet": "true",
            //         "layer": "4L",
            //         "length": 45,
            //         "width": 37,
            //         "height": 44.88,
            //         "weight": 1000,
            //         "netWeightPerPallet": 654.885,
            //         "grossWeightPerPallet": 700.72695,
            //         "maxWeightTon": 1000,
            //         "baseUnitAbbreviation": "kg",
            //         "binCutsize": {
            //           "size": "20'",
            //           "length": 228,
            //           "width": 90,
            //           "height": 90,
            //           "maxWeight": 2.7,
            //         },
            //         "uomConversionRates": {
            //           "kg": 1,
            //           "ream": 2.183,
            //           "box": 10.9148,
            //           "pallet": 654.885,
            //           "ton": 1000
            //         }
            //       },
            //       {
            //         "documentNo": "A0108224Z",
            //         "type": "cutsize",
            //         "unitstype": "1CZE-DN-070-A04-500-4L-002",
            //         "product": "1CZE-DC-070-A04-500-001 : 1CZE-DN-070-A04-500-4L-002",
            //         "internalId": "3835",
            //         "displayName": "Double A (China) 70G A4 (500) AUTO 4L 300R/P SS",
            //         "pallet": "true",
            //         "layer": "4L",
            //         "length": 46.06,
            //         "width": 41.73,
            //         "height": 39.37,
            //         "weight": 1000,
            //         "netWeightPerPallet": 654.885,
            //         "grossWeightPerPallet": 700.72695,
            //         "maxWeightTon": 1000,
            //         "baseUnitAbbreviation": "kg",
            //         "binCutsize": {
            //           "size": "20'",
            //           "length": 228,
            //           "width": 90,
            //           "height": 90,
            //           "maxWeight": 2.7,
            //         },
            //         "uomConversionRates": {
            //           "kg": 1,
            //           "ream": 2.183,
            //           "box": 10.9148,
            //           "pallet": 654.885,
            //           "ton": 1000
            //         }
            //       }
            //     ],
            //     "Double A (China) 70G A3 (500) - 3kg": [
            //       {
            //         "documentNo": "A0108224Z",
            //         "type": "cutsize",
            //         "unitstype": "1CZE-DN-070-A03-500-4L-001",
            //         "product": "1CZE-DC-070-A03-500-001 : 1CZE-DN-070-A03-500-4L-001",
            //         "internalId": "3839",
            //         "displayName": "Double A (China) 70G A3 (500) AUTO 4L 140R/P N",
            //         "pallet": "true",
            //         "layer": "4L",
            //         "length": 45,
            //         "width": 37,
            //         "height": 44.88,
            //         "weight": 1000,
            //         "netWeightPerPallet": 611.226,
            //         "grossWeightPerPallet": 654.01182,
            //         "maxWeightTon": 1000,
            //         "baseUnitAbbreviation": "kg",
            //         "binCutsize": {
            //           "size": "20'",
            //           "length": 228,
            //           "width": 90,
            //           "height": 90,
            //           "maxWeight": 2.7,
            //         },
            //         "uomConversionRates": {
            //           "kg": 1,
            //           "ream": 4.3659,
            //           "box": 21.8295,
            //           "pallet": 611.226,
            //           "ton": 1000
            //         }
            //       },
            //       {
            //         "documentNo": "A0108224Z",
            //         "type": "cutsize",
            //         "unitstype": "1CZE-DN-070-A03-500-4L-002",
            //         "product": "1CZE-DC-070-A03-500-001 : 1CZE-DN-070-A03-500-4L-002",
            //         "internalId": "3840",
            //         "displayName": "Double A (China) 70G A3 (500) AUTO 4L 140R/P SS",
            //         "pallet": "true",
            //         "layer": "4L",
            //         "length": 46.06,
            //         "width": 41.73,
            //         "height": 39.37,
            //         "weight": 1000,
            //         "netWeightPerPallet": 611.226,
            //         "grossWeightPerPallet": 618.226,
            //         "maxWeightTon": 1000,
            //         "baseUnitAbbreviation": "kg",
            //         "binCutsize": {
            //           "size": "20'",
            //           "length": 228,
            //           "width": 90,
            //           "height": 90,
            //           "maxWeight": 2.7,
            //         },
            //         "uomConversionRates": {
            //           "kg": 1,
            //           "ream": 4.3659,
            //           "box": 21.8295,
            //           "pallet": 611.226,
            //           "ton": 1000
            //         }
            //       }
            //     ]
            //   },
            selectedOption: jsonData.selectedOption,
            selectedStatus: jsonData.selectedStatus,
            boxesMixed: boxesMixed,
            boxesCutsize: boxesCutsize,
            boxesFolio: boxesFolio,
            boxesRoll: boxesRoll,
            boxesCMSheet: boxesCMSheet,
            boxesCMRoll: boxesCMRoll,
            boxesHoneycomb: boxesHoneycomb,
            boxesPulp: boxesPulp,
            boxesBoxCover: boxesBoxCover,
            boxesWrapper: boxesWrapper,
            boxesDAOS: boxesDAOS,
            boxesDAN: boxesDAN,
            boxesDACP: boxesDACP
        };
        log.debug('payloadToSuitelet2 being sent to Suitelet', JSON.stringify(payloadToSuitelet2 , null, 2));

        // Send the data using https.post (server-side request)
        var response = https.post({
            url: suitelet2,
            body: JSON.stringify(payloadToSuitelet2), // Convert object to JSON
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (action == 'viewContainerList'){

            var jsonResult2 = response.body;

            // Write result to the browser 
            context.response.setHeader({
                name: 'Content-Type',
                value: 'application/json'
            });
            
            context.response.write(jsonResult2);
           
        } else if (action == 'view3D'){

            var jsonResult2 = JSON.parse(response.body);
            var myCache = cache.getCache({ name: 'MySuiteletCache', scope: cache.Scope.PUBLIC });

            // Save your JSON data as string in cache
            var key = 'key_' + Date.now(); // unique key
            myCache.put({
                key: key,
                value: jsonResult2,
                expiration: 600 // cache expires in 10 minutes
            });

            // Confirm the value was stored
            var testValue = myCache.get({ key: key });
            log.debug('Cache Write Success', testValue);


            // Redirect to Suitelet 3 with the key param
            var fullUrl = suitelet3 + '&key=' + key;
            log.debug('Redirecting to Suitelet 3 URL', fullUrl);

            redirect.redirect({
                url: fullUrl
            });
        }

    } else {
        log.debug('else');
    }
}
