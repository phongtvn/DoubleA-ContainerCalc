/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/query', 'N/record', 'N/runtime', 'N/search', './Lib/libSuiteQL.js', './Lib/Libraries Code 2.0.220622.js', './Lib/libSCA.js'],
    /**
     * @param{query} query
     * @param{record} record
     * @param{runtime} runtime
     * @param{search} search
     */
    (query, record, runtime, search, libSuiteQL, libCode, libSca) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {

            let params = scriptContext.request.parameters;

            let action = params.action;

            let imgurl = "https://sca.doubleapaper.com/assets/Container_Image/container.png";

            let returnObj = {}
            try {
              //  log.debug("customer_id", customer_id)

                if (action == "getAvailableContainerpallet") {

                    let customer_id = params.customer_id;
                    if (!!customer_id) {

                        let availablecon = {};
                        let avaliconainer,avalipallet,defaultsize;

                        //load record for customer
                        let custRec = record.load({type: "customer", id: customer_id, isDynamic: true});
                        let subsidiary = custRec.getValue({fieldId: "subsidiary"});
                        let cusCountryName = custRec.getValue({fieldId: "cseg_cust_country"});
                        let cusCountryText = custRec.getText({fieldId: "cseg_cust_country"});
                        let defaultconincus = custRec.getText({fieldId: "custentity_sca_cust_containertype"});

                        let filters_master = [
                            {
                                name: "custrecord_con_pal_country",
                                operator: search.Operator.IS,
                                values: cusCountryName
                            }
                        ];
                        
                        // load record get default container by customer
                        let filters_conByCustomer_master = [
                            {
                                name: "custrecord_customer",
                                operator: search.Operator.IS,
                                values: customer_id
                            }
                        ];
                        
                        let columns = [
                            'custrecord_pal_type',
                            'custrecord_con_type',
                            'custrecord_con_pal_country',
                            'custrecord_defaultconsize',
                            'custrecord_max_net_weight'
                        ];
                        let columns_conByCustomer = ['custrecord_container'];
                        
                        // run the customer-specific container search
                        let ss_conByCustomer_master = libCode.loadSavedSearch( "customrecord_container_pallet_by_cust", "", filters_conByCustomer_master, columns_conByCustomer );
                        
                        // if customer has specific container, add extra filter
                        if (ss_conByCustomer_master && ss_conByCustomer_master.length > 0) {
                            let customerContainer = ss_conByCustomer_master[0].getValue({ name: "custrecord_container"});
                        
                            if (customerContainer) {
                                filters_master.push({
                                    name: "custrecord_con_type",
                                    operator: search.Operator.ANYOF,
                                    values: customerContainer
                                });
                            }
                        }
                        
                        // now run the conmaster search with updated filters
                        let ss_conmaster = libCode.loadSavedSearch("customrecord_con_pal_type", "", filters_master, columns);
                        
                        avaliconainer = ss_conmaster[0].getText({name: "custrecord_con_type"});
                        // avalipallet = ss_conmaster[0].getText({name: "custrecord_pal_type"});
                        let maxweight = ss_conmaster[0].getValue({name: "custrecord_max_net_weight"});
                        let canSelectcon = ss_conmaster[0].getValue({name: "custrecord_can_select_con"});
                        // let defconsize = ss_conmaster[0].getText({name: "custrecord_defaultconsize"});
                        let defconsize =
                            (ss_conByCustomer_master && ss_conByCustomer_master.length > 0 && ss_conByCustomer_master[0].getText({ name: "custrecord_container" })) ||
                            (ss_conmaster && ss_conmaster.length > 0 && ss_conmaster[0].getText({ name: "custrecord_defaultconsize" }));

                        log.debug('defconsize', defconsize);
                        //Container Detail
                        let defaultcontainer = [];
                        let container = [];
                        let split_con = avaliconainer.split(",");
                        // log.debug('split_con',JSON.stringify(split_con));
                        for (let i = 0; i < split_con.length; i++) {
                            
                            let filters_con = [
                                {
                                    name: "name",
                                    operator: search.Operator.IS,
                                    values: split_con[i]
                                }
                            ]
                            // log.debug('split_con[i]',JSON.stringify(split_con[i]));
                            let  columns_con =  ['internalid', 'name', 'custrecord_con_maxweight', 'custrecord_con_dimensionlength', 'custrecord_con_dimensionwide', 'custrecord_con_dimensionheight']
                            let ss_condetail = libCode.loadSavedSearch("customrecord_exp_containerssize", "", filters_con, columns_con);
                            
                            if (ss_condetail.length > 0) {
                                let condetail = {
                                    id: ss_condetail[0].getValue({ name: "internalid" }),
                                    name: ss_condetail[0].getValue({ name: "name" }),
                                    dimension_length: ss_condetail[0].getValue({ name: "custrecord_con_dimensionlength" }),
                                    dimension_wide: ss_condetail[0].getValue({ name: "custrecord_con_dimensionwide" }),
                                    dimension_height: ss_condetail[0].getValue({ name: "custrecord_con_dimensionheight" }),
                                    maxweight: ss_condetail[0].getValue({ name: "custrecord_con_maxweight" }),
                                    isdefaultsize: (defconsize == ss_condetail[0].getValue({ name: "name" }))
                                };
                        
                                if(condetail.isdefaultsize == true){
                                    log.debug('condetail[i]',JSON.stringify(condetail));
                                    defaultcontainer.push(condetail);
                                }
                                // log.debug('condetail', JSON.stringify(condetail));
                        
                                container.push(condetail);
                            }
                        }

                        // log.debug('container',JSON.stringify(container));
                        //Pallet Detail
                        // let palletdetail = {};
                        // let pallet = [];
                        // let split_pallet = avalipallet.split(",");
                        // // log.debug('split_pallet',JSON.stringify(split_pallet));
                        // for (let i = 0; i < split_pallet.length; i++) {
                        //     let palname = "";
                            
                        //     if(split_pallet[i] == 'N'){
                        //         palname = "Normal Pallet";
                        //     }else if(split_pallet[i] == 'S'){
                        //         palname = "Shortleg pallet";
                        //     }else if(split_pallet[i] == 'SS'){
                        //         palname = "Slipsheet";
                        //     }else{
                        //         palname = "Normal Pallet";
                        //     }
                            
                        //     let palletdetail = { name: palname };

                        //     pallet.push(palletdetail);
                        // }

                        
                    //return obj
                    returnObj = {

                        status: "success",
                        action: "getAvailableContainerpallet",
                        customer_id: customer_id,
                        subsidiary: subsidiary,
                        country: cusCountryName,
                        countryname: cusCountryText,
                        maxweight: maxweight,
                        imgurl: imgurl,
                        canSelectcon: canSelectcon,
                        defaultcontainer,
                        container
                        // finalForm
                    }

                    } else {
                        returnObj = {
                            status: "error",
                            message: "Please specify customer ID"
                        }
                    }


                }else if(action == "updateDefaultContainerSize"){
                    // let customer_id = params.customer_id;
                    // let newsize = params.containersize;
                    // //set default container size
                    // let custRec = record.load({type: "customer", id: customer_id, isDynamic: true});
                    // custRec.setValue({ fieldId: 'custentity_sca_cust_containertype', value: newsize });
                    // custRec.save();


                    // try {
                    //      //set default container size
                    //     let custRec = record.load({type: "customer", id: customer_id, isDynamic: true});
                    //     custRec.setValue({ fieldId: 'custentity_sca_cust_containertype', value: newsize });
                    //     custRec.save();

                    //     returnObj = {
                    //         action: action,
                    //         customer_id: customer_id,
                    //         status: "success",
                    //         defaultcontainersize: newsize
                    //     }
                    // } catch (error) {
                    //     returnObj = {
                    //         action: action,
                    //         customer_id: customer_id,
                    //         status: "Failed",
                    //         error: error.message
                    //     }
                    // }
                    
                }

            } catch (ex) {
                returnObj = {
                    status: "error",
                    message: libCode.getErrorMessage(ex)
                }
            }

            log.debug("returnObj", returnObj);

            scriptContext.response.write({
                output: JSON.stringify(returnObj)
            });
        }
        

        // function modifyJSONString(jsonString, internalListId, internalListValue) {
        //     try {
        //         let data = JSON.parse(jsonString);
        
        //         function findAndModify(obj) {
        //             if (typeof obj !== "object" || obj === null) return;
        
        //             if (Array.isArray(obj)) {
        //                 obj.forEach(findAndModify);
        //             } else {
        //                 let index = internalListId.indexOf(obj.internalid); // หา index ของ internalid ใน list
        //                 if (index !== -1 && Array.isArray(obj.dropValues)) {
        //                     let newValue = internalListValue[index]; // ค่าที่ต้องเพิ่ม
        //                     if (newValue) { // ตรวจสอบว่ามีค่าหรือไม่ (ป้องกัน undefined)
        //                         obj.dropValues.push({ name: newValue, value: newValue });
        //                     }
        //                 }
        
        //                 // ตรวจสอบ object ซ้อนกัน
        //                 for (let key in obj) {
        //                     findAndModify(obj[key]);
        //                 }
        //             }
        //         }
        
        //         findAndModify(data);
        
        //         return JSON.stringify(data);
        //     } catch (ex) {
        //         returnObj = {
        //             status: "error",
        //             message: libCode.getErrorMessage(ex)
        //         }
        //     }
        // }


        return {onRequest}

    });