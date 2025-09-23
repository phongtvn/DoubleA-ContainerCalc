/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 */

define([
        'N/error','N/file','N/record','N/runtime','N/search','N/cache','./Calc/calcCopyPaper'],
    
    function(error, file, record, runtime, search, cache, calcCopyPaper) {
        //todo: cover shipt to country on the item
        /**
         * Main Suitelet Entry Point
         * Handles container packing calculations for paper products
         */
        function onRequest(context) {
            try {
                if (context.request.method !== 'POST') {
                    return handleError(context, 'Only POST method is supported');
                }
                
                const requestData = JSON.parse(context.request.body)
                log.debug('requestData', requestData)
                const processor = new ContainerPackingProcessor(requestData);
                const result = processor.process();
                
                return handleResponse(context, result, requestData);
                
            } catch (error) {
                log.error('onRequest Error', error);
                return handleError(context, error);
            }
        }
        
        /**
         * Container Packing Processor Class
         */
        function ContainerPackingProcessor(requestData) {
            this.requestData = requestData;
            this.customerId = requestData.customer_id;
            this.items = requestData.items || [];
            
            // Initialize result containers
            this.containers = {
                freeGifts: {},
                boxesCutsize: {},
                boxesFolio: {},
                boxesRoll: {},
                boxesCMSheet: {},
                boxesCMRoll: {},
                boxesHoneycomb: {},
                boxesPulp: {},
                boxesBoxCover: {},
                boxesWrapper: {},
                boxesDAOS: {},
                boxesDAN: {},
                boxesDACP: {},
                boxesMixed: {}
            };
            
            // Store global data
            this.globalContainerData = null;
            this.globalTolerance = null;
        }
        
        ContainerPackingProcessor.prototype = {
            /**
             * Main processing method
             */
            process: function() {
                if (!this.items.length) {
                    log.debug('No items to process');
                    return this.buildPayload();
                }
                
                const customerData = this.loadCustomerData();
                this.globalTolerance = customerData.tolerance;
                
                // Load container data from first item
                if (this.items[0]) {
                    this.globalContainerData = this.loadContainerDataFromItem(this.items[0]);
                }
                
                for (let i = 0; i < this.items.length; i++) {
                    this.processItem(this.items[i], i, customerData);
                }
                
                return this.calculateResults();
            },
            
            /**
             * Load container data from item
             */
            loadContainerDataFromItem: function(item) {
                const containerId = item.custpage_container.id;
                const containerRec = record.load({
                    type: 'customrecord_exp_containerssize',
                    id:  containerId
                });
                
                return {
                    size: containerRec.getText('name') || null,
                    length: parseFloat(containerRec.getValue('custrecord_con_dimensionlength')) || 0,
                    width: parseFloat(containerRec.getValue('custrecord_con_dimensionwide')) || 0,
                    height: parseFloat(containerRec.getValue('custrecord_con_dimensionheight')) || 0,
                    maxWeight: parseFloat(containerRec.getValue('custrecord_con_maxweight'))/1000 || 0
                };
            },
            
            /**
             * Load customer related data
             */
            loadCustomerData: function() {
                const customerLookup = search.lookupFields({
                    type: 'customer',
                    id: this.customerId,
                    columns: [
                        'cseg_sale_channel',
                        'custentity_ship_to_country',
                        'cseg_dist_chanl'
                    ]
                });
                
                const palletData = this.loadCustomerPalletData();
                
                return {
                    pallet: palletData.customerPallet,
                    tolerance: palletData.tolerance,
                    saleChannel: extractLookupValue(customerLookup.cseg_sale_channel),
                    shipToCountry: extractLookupValue(customerLookup.custentity_ship_to_country),
                    distributionChannel: extractLookupValue(customerLookup.cseg_dist_chanl)
                };
            },
            
            /**
             * Load customer pallet preferences
             */
            loadCustomerPalletData: function() {
                const containerPalletSearch = search.create({
                    type: 'customrecord_container_pallet_by_cust',
                    filters: [['custrecord_customer', 'is', this.customerId]],
                    columns: ['custrecord_country', 'custrecord_customer_pallet_default', 'custrecord_tolerance']
                });
                
                const results = containerPalletSearch.run().getRange({ start: 0, end: 1 });
                
                if (results.length > 0) {
                    const result = results[0];
                    return {
                        customerPallet: result.getValue('custrecord_customer_pallet_default'),
                        tolerance: result.getValue('custrecord_tolerance')
                    };
                }
                
                return { customerPallet: null, tolerance: null };
            },
            
            /**
             * Process individual item
             */
            processItem: function(item, index, customerData) {
                const itemProcessor = new ItemProcessor(item, customerData, this.containers, this.itemType);
                itemProcessor.process();
            },
            
            /**
             * Build final payload
             */
            buildPayload: function() {
                const payload = {
                    action: this.requestData.action || 'view3D',
                    selectedStatus: this.requestData.selectedStatus,
                    selectedOption: this.requestData.selectedOption,
                    freeGifts: this.containers.freeGifts,
                    ...this.containers
                };
                
                // Add global container data and tolerance
                if (this.globalContainerData) {
                    payload.containerData = this.globalContainerData;
                }
                if (this.globalTolerance) {
                    payload.tolerance = this.globalTolerance;
                }
                
                return payload;
            },
            
            /**
             * Calculate final results using external algorithm
             */
            calculateResults: function() {
                const payload = this.buildPayload();
                log.debug('Processing payload', JSON.stringify(payload, null, 2));
                if(!isEmpty(payload.boxesCutsize))
                    return calcCopyPaper.greedyCalcCutsize(payload);
              
            }
        };
        /**
         * Individual Item Processor
         */
        function ItemProcessor(item, customerData, containers, itemType) {
            this.item = item;
            this.customerData = customerData;
            this.containers = containers;
            
            // Extract item properties
            this.itemId = item.custpage_product.id;
            this.containerId = item.custpage_container.id;
            this.qtyUOM = this.normalizeUOM(item.custpage_quantityuom.text);
            this.quantity = item.custpage_quantity;
            this.itemType = itemType
            log.debug('this.customerData', customerData)
            this.pallet = customerData.pallet;
            if(item.selectedPallet)
                this.pallet = item.selectedPallet.id;
        }
        
        ItemProcessor.prototype = {
            /**
             * Process the item
             */
            process: function() {
                const itemData = this.loadItemData();
                const specialConditions = this.loadSpecialConditions(itemData);
                log.debug('specialConditions', specialConditions)
                // if (this.isCopyPaper(itemData.productTypeName)) {
                this.getItemData(itemData, specialConditions);
                // } else {
                //     // Handle other product types
                //     this.processOtherProductType(itemData, specialConditions);
                // }
            },
            
            /**
             * Normalize UOM text
             */
            normalizeUOM: function(uom) {
                const uomMap = {
                    'EA': 'box',
                    'MT': 'ton'
                };
                return uomMap[uom] || uom;
            },
            
            /**
             * Load item master data
             */
            loadItemData: function() {
                const itemLookup = search.lookupFields({
                    type: 'item',
                    id: this.itemId,
                    columns: [
                        'recordtype',
                        'custitem_infor_sca_itemsubtype',
                        'displayname'
                    ]
                });
                
                let productTypeName = null;
                
                const productTypeID = extractLookupValue(itemLookup.custitem_infor_sca_itemsubtype)
                
                if (productTypeID) {
                    const typeNameLookup = search.lookupFields({
                        type: 'customrecord_sca_itemsubtype_mappinglist',
                        id: productTypeID,
                        columns: ['name']
                    });
                    productTypeName = typeNameLookup.name;
                }
                
                return {
                    itemType: itemLookup.recordtype,
                    productTypeID: productTypeID,
                    productTypeName: productTypeName,
                    displayName: itemLookup.displayname
                };
            },
            
            /**
             * Load special conditions for this item
             */
            loadSpecialConditions: function(itemData) {
                const filters = [
                    ['custrecord_criteria_salechannel', 'anyof', this.customerData.saleChannel], 'AND',
                    ['custrecord_criteria_shiptocountry', 'anyof', this.customerData.shipToCountry], 'AND',
                    ['custrecord_criteria_distributionchannel', 'anyof', this.customerData.distributionChannel], 'AND',
                    ['custrecord_criteria_containersize', 'anyof', this.containerId]
                ];
                
                const specialConditionSearch = search.create({
                    type: 'customrecord_special_condition',
                    filters: filters,
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
                
                return this.filterSpecialConditions(specialConditionSearch, itemData);
            },
            
            /**
             * Filter special conditions based on business rules
             */
            filterSpecialConditions: function(specialConditionSearch, itemData) {
                const validConditions = [];
                
                specialConditionSearch.run().each((result) => {
                    if (this.isConditionApplicable(result, itemData)) {
                        validConditions.push(this.parseSpecialCondition(result));
                    }
                    return true;
                });
                
                return validConditions;
            },
            
            /**
             * Check if special condition is applicable
             */
            isConditionApplicable: function(result, itemData) {
                const palletType = result.getValue('custrecord_criteria_pallettype');
                const scaItemSubtype = result.getValue('custrecord_criteria_scaitemsubtype');
                
                const palletMatch = this.checkPalletTypeMatch(palletType);
                const subtypeMatch = this.checkSubtypeMatch(scaItemSubtype, itemData.productTypeID);
                
                return palletMatch && subtypeMatch;
            },
            
            /**
             * Check pallet type compatibility
             */
            checkPalletTypeMatch: function(palletType) {
                if (!palletType) return true;
                
                const palletTypeArr = palletType.split(',').map(v => v.trim());
                const customerPalletArr = Array.isArray(this.customerData.pallet) ?
                    this.customerData.pallet : [this.customerData.pallet];
                
                return customerPalletArr.some(cp => palletTypeArr.includes(cp));
            },
            
            /**
             * Check subtype compatibility
             */
            checkSubtypeMatch: function(scaItemSubtype, itemProductTypeID) {
                if (!scaItemSubtype) return true;
                
                const scaItemSubtypeArr = scaItemSubtype.split(',').map(v => v.trim());
                
                return itemProductTypeID && scaItemSubtypeArr.includes(itemProductTypeID);
            },
            
            /**
             * Parse special condition result into structured data
             */
            parseSpecialCondition: function(result) {
                return {
                    scTitle: result.getValue('custrecord_title'),
                    scShiptocountry: result.getValue('custrecord_criteria_shiptocountry'),
                    scScaitemsubtype: this.parseArrayField(result.getValue('custrecord_criteria_scaitemsubtype')),
                    scGram: result.getValue('custrecord_criteria_gram'),
                    scPapersize: this.parseArrayField(result.getValue('custrecord_criteria_papersize')),
                    scPallettype: result.getValue('custrecord_criteria_pallettype'),
                    scLayer: this.parseArrayField(result.getValue('custrecord_criteria_layer')),
                    scReamsperpallet: result.getValue('custrecord_criteria_reamsperpallet'),
                    scSheet: result.getValue('custrecord_criteria_sheet'),
                    scMinNetWeight: result.getValue('custrecord_guideline_minnetweight'),
                    scMaxPallets: result.getValue('custrecord_guideline_maxpallets'),
                    scMaxLayers: result.getValue('custrecord_guideline_maxlayers'),
                    scPosition: result.getValue('custrecord_guideline_position'),
                    scCondition: result.getValue('custrecord_guideline_condition')
                };
            },
            
            /**
             * Parse comma-separated field into array
             */
            parseArrayField: function(fieldValue) {
                return fieldValue ? fieldValue.toString().split(',').map(v => v.trim()) : [];
            },
            
            /**
             * Check if product is copy paper
             */
            isCopyPaper: function(productTypeName) {
                return productTypeName && productTypeName.toLowerCase().includes('copy paper');
            },
            
            /**
             * Process copy paper items
             */
            getItemData: function(itemData, specialConditions) {
                const weight = this.quantity // / 100;
                const itemVariants = this.loadItemVariants(itemData, specialConditions);
                log.debug('itemVariants', itemVariants)
                
                const variants = [];
                itemVariants.forEach((variant) => {
                    const processedItem = this.buildItem(
                        variant,
                        itemData,
                        weight
                    );
                    variants.push(processedItem);
                });
                
                const parentKey = `${itemData.displayName}`; // - ${weight}${this.qtyUOM}`;
                
                // Store in the new format with weight and variants
                this.containers.boxesCutsize[parentKey] = {
                    weight: weight,
                    variants: variants
                };
            },
            
            /**
             * Load item variants (children products)
             */
            loadItemVariants: function(itemData, specialConditions) {
                const filters = this.buildVariantFilters(specialConditions);
                filters.push('AND', ['parent', 'is', this.itemId]);
                filters.push('AND', ['custitem_infor_for_sales_country', 'is', this.customerData.shipToCountry]);
                const searchItemData = this.searchItemData(itemData.itemType, filters);
            //    log.debug('searchItemData', searchItemData)
                return searchItemData
            },
            
            /**
             * Search for item data with specified filters
             */
            searchItemData: function(itemType, filters) {
               // log.debug('filters', filters)
                const itemSearch = search.create({
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
                
                return itemSearch.run().getRange({ start: 0, end: 1000 }) || [];
            },
            
            /**
             * Build filters for item variants based on special conditions
             */
            buildVariantFilters: function(specialConditions) {
             //   log.debug('this.customerData', this.customerData)
                if(!this.pallet )
                    throw 'Select Pallet first'
                
                const filters = [['custitem_infor_pallet_type', 'anyof', this.pallet]];
                log.debug('specialConditions', specialConditions)
                if (!specialConditions.length) return filters;
                
                const aggregatedCriteria = this.aggregateSpecialConditions(specialConditions);
                
                // Add filters based on aggregated criteria
                Object.entries(aggregatedCriteria).forEach(([field, values]) => {
                    if (values.length > 0) {
                        filters.push('AND', [field, 'anyof', values]);
                    }
                });
                
                return filters;
            },
            
            /**
             * Aggregate special conditions to avoid duplicates
             */
            aggregateSpecialConditions: function(specialConditions) {
                const sets = {
                    layer: new Set(),
                    paperSize: new Set(),
                    subtype: new Set(),
                    gram: new Set()
                };
                
                specialConditions.forEach((sc) => {
                    sc.scLayer?.forEach(layer => sets.layer.add(layer));
                    sc.scPapersize?.forEach(size => sets.paperSize.add(size));
                    sc.scScaitemsubtype?.forEach(subtype => sets.subtype.add(subtype));
                    if (sc.scGram) sets.gram.add(sc.scGram);
                });
                log.debug('FILTER', {
                    'custitem_infor_layer': Array.from(sets.layer),
                    'custitem_infor_paper_size': Array.from(sets.paperSize),
                    'custitem_infor_sca_itemsubtype': Array.from(sets.subtype),
                    'cseg_item_gram': Array.from(sets.gram)
                })
                return {
                    'custitem_infor_layer': Array.from(sets.layer),
                    'custitem_infor_paper_size': Array.from(sets.paperSize),
                    'custitem_infor_sca_itemsubtype': Array.from(sets.subtype),
                    'cseg_item_gram': Array.from(sets.gram)
                };
            },
            
            /**
             * Build cutsize item data structure
             */
            buildItem: function(variant, itemData, weight) {
                const uomRates = this.getUOMConversionRates(variant);
                
                return {
                    type: this.itemType,
                    parentID: this.itemId,
                    parentName: itemData.displayName,
                    unitstype: variant.getText({ name: 'unitstype' }),
                    product: variant.getValue({ name: 'itemid' }),
                    internalId: variant.getValue({ name: 'internalid' }),
                    displayName: variant.getValue({ name: 'displayname' }),
                    pallet: this.hasPalletDimensions(variant) ? 'true' : 'false',
                    palletType: variant.getText({ name: 'custitem_infor_pallet_type' }),
                    layer: variant.getText({ name: 'custitem_infor_layer' }) || 'N/A',
                    length: parseFloat(variant.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0),
                    width: parseFloat(variant.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0),
                    height: parseFloat(variant.getValue({ name: 'custitem_infor_pallet_height_inch' }) || 0),
                    weight: parseFloat(weight || 0),
                    netWeightPerPallet: parseFloat(variant.getValue({ name: 'custitem_infor_std_net_weight' }) || 0),
                    grossWeightPerPallet: parseFloat(variant.getValue({ name: 'custitem_infor_gross_weight' }) || 0),
                    maxWeightTon: weight,
                    baseUnitAbbreviation: this.qtyUOM || uomRates.baseUnitAbbreviation,
                    uomConversionRates: uomRates.rates
                };
            },
            
            /**
             * Check if variant has pallet dimensions
             */
            hasPalletDimensions: function(variant) {
                const width = parseFloat(variant.getValue({ name: 'custitem_infor_pallet_wide_inch' }) || 0);
                const length = parseFloat(variant.getValue({ name: 'custitem_infor_pallet_length_inch' }) || 0);
                return width > 0 && length > 0;
            },
            
            /**
             * Get UOM conversion rates for variant
             */
            getUOMConversionRates: function(variant) {
                const unitTypeId = variant.getValue({ name: 'unitstype' });
                let rates = {};
                let baseUnitAbbreviation = '';
                
                if (unitTypeId) {
                    const unitTypeRecord = record.load({ type: record.Type.UNITS_TYPE, id: unitTypeId });
                    const lineCount = unitTypeRecord.getLineCount({ sublistId: 'uom' });
                    
                    for (let j = 0; j < lineCount; j++) {
                        const abbreviation = unitTypeRecord.getSublistValue({
                            sublistId: 'uom', fieldId: 'abbreviation', line: j
                        })?.toLowerCase();
                        
                        const baseUnit = unitTypeRecord.getSublistValue({
                            sublistId: 'uom', fieldId: 'baseunit', line: j
                        });
                        
                        const conversionRate = unitTypeRecord.getSublistValue({
                            sublistId: 'uom', fieldId: 'conversionrate', line: j
                        });
                        
                        if (abbreviation) {
                            rates[abbreviation] = parseFloat(conversionRate) || 1;
                            if (baseUnit) {
                                baseUnitAbbreviation = abbreviation;
                            }
                        }
                    }
                }
                
                return { rates, baseUnitAbbreviation };
            },
            
            /**
             * Process other product types (placeholder)
             */
            processOtherProductType: function(itemData, specialConditions) {
                // TODO: Implement processing for other product types
                // (Folio, Roll, CMSheet, etc.)
                log.debug('Processing other product type', itemData.productTypeName);
            }
        };
        
        /**
         * Utility Functions
         */
        
        /**
         * Handle successful response
         */
        function handleResponse(context, result, requestData) {
            const SUITELET_3D_URL = 'https://8158655.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1693&deploy=1&compid=8158655&ns-at=AAEJ7tMQuDL0qZx_sUKJpUu0z6TuDn2Zx_BpEVeoSzRxzfKidLk';
            
            context.response.setHeader({
                name: 'Content-Type',
                value: 'application/json'
            });
            
            if (requestData.action === 'viewContainerList') {
                //log.debug('result viewContainerList', result)
                
                if (requestData.selectedOption && requestData.selectedOption.length > 0) {
                    
                    result.selectedOption = requestData.selectedOption;
                    
                    if (requestData.selectedStatus === "adjustedQty"){
                        
                        // var nonNullCount = 0;
                        
                        // for (var key in recommendedBestFitItems) {
                        //     var arr = recommendedBestFitItems[key];
                        //     var valid = false;
                        //
                        //     for (var i = 0; i < arr.length; i++) {
                        //
                        //         if (arr[i] !== null && arr[i] !== undefined) {
                        //             valid = true;
                        //             break;
                        //         }
                        //     }
                        //
                        //     if (valid) {
                        //         nonNullCount++;
                        //     }
                        // }
                        //
                        // if (nonNullCount === 0){
                        //     transformed.adjustedQtyStatus = "overLimit";
                        // } else {
                        //     transformed.adjustedQtyStatus = "ok";
                        // }
                    }
                }
                
                context.response.write(JSON.stringify(result));
            } else if (requestData.action === 'view3D') {
                const cacheKey = 'key_' + Date.now();
                const myCache = cache.getCache({ name: 'MySuiteletCache', scope: cache.Scope.PUBLIC });
                
                myCache.put({
                    key: cacheKey,
                    value: result,
                    expiration: 600 // 10 minutes
                });
                
                const redirectUrl = SUITELET_3D_URL + '&key=' + cacheKey;
                log.debug('redirectUrl', redirectUrl)
                
                context.response.write(JSON.stringify({ redirectUrl }));
            }
        }
        
        /**
         * Handle errors
         */
        function handleError(context, message) {
            context.response.setHeader({
                name: 'Content-Type',
                value: 'application/json'
            });
            const returnErr = {
                error: 'Error: ' + message
            };
            context.response.write(JSON.stringify(returnErr));
        }
        
        function extractLookupValue(lookupField) {
            if (Array.isArray(lookupField) && lookupField[0]) {
                return lookupField[0].value;
            }
            return lookupField || null;
        }
        
        function isEmpty(obj) {
            return Object.keys(obj).length === 0;
        }
        return {
            onRequest: onRequest
        };
    });