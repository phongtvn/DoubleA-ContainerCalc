define(['N/record', 'N/log', 'N/search'], (record, log, search) => {
    
    /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */

    const getFormType = (actiontype,formtype) => {
        let responseObj = {};
        
        let typeform = getConfigForm(formtype)
        log.debug('Field typeform', JSON.stringify(typeform));
        if(actiontype === 'GET'){
            try {
                log.debug('GET Request Received');
                let objResponse = {};

                const fieldLookUp = search.lookupFields({
                    type: typeform.RECORD_TYPE,
                    id: typeform.RECORD_ID,
                    columns: typeform.FIELDS_ID
                });
        
                if(fieldLookUp && isDefinedNotNullNotEmpty(fieldLookUp)) {
                    objResponse.success = true;
                    for(let i = 0; i < typeform.FIELDS_ID.length; i++) {
                        log.debug('Field Lookup', fieldLookUp[typeform.FIELDS_ID[i]]);
                        objResponse[typeform.FIELDS_NAME[i]] = JSON.parse(fieldLookUp[typeform.FIELDS_ID[i]]);
                    }
                    // objResponse[config.FIELDS_NAME[0]] = JSON.parse(fieldLookUp[config.FIELDS_ID[0]]);
                }

                // context.response.write({
                //     output: JSON.stringify(objResponse)
                // });
                return JSON.stringify(objResponse);
                
            } catch (e) {
                log.error('GET Error', e.message);
                // context.response.write({
                //     output: JSON.stringify({ success: false, message: e.message })
                // });
                return JSON.stringify({ success: false, recordId: e.message });
            }

        } else if (actiontype === 'POST') {
            try {
                log.debug('POST Request Received');
                log.debug('JSON Body', context.request.body);
                
                const jsonBody = JSON.parse(context.request.body);
                const { recordType, recordId, fields } = jsonBody;
                
                const rec = record.load({ type: recordType, id: recordId });
                
                Object.entries(fields).forEach(([field, value]) => {
                    rec.setValue({ fieldId: field, value });
                });

                const savedRecordId = rec.save();
                log.debug('Record Updated', `Record ID: ${savedRecordId}`);
                
                // context.response.write({
                //     output: JSON.stringify({ success: true, recordId: savedRecordId })
                // });

                return JSON.stringify({ success: true, recordId: savedRecordId });
            } catch (e) {
                log.error('POST Error', e.message);
                // context.response.write({
                //     output: JSON.stringify({ success: false, message: e.message })
                // });
                return JSON.stringify({ success: false, recordId: e.message });
            }
        } else if (actiontype === 'PUT') {
            try {
                log.debug('PUT Request Received');
                log.debug('JSON Body', context.request.body);
               
                // context.response.write({
                //     output: JSON.stringify({ success: true, recordId: savedRecordId })
                // });

                return JSON.stringify({ success: true, recordId: savedRecordId });
            } catch (e) {
                log.error('POST Error', e.message);
                // context.response.write({
                //     output: JSON.stringify({ success: false, message: e.message })
                // });

                return JSON.stringify({ success: false, recordId: e.message });
            }
        } else {
            // context.response.write({
            //     output: JSON.stringify({ success: false, message: 'Only GET , POST and PUT requests are allowed.' })
            // });
            
            return JSON.stringify({ success: false, message: 'Only GET , POST and PUT requests are allowed.' });
        }
    }

    const getConfigForm = (formtype) => {

        let configform;
        log.debug("typeform",formtype);
        if(formtype === 'userregis'){
            configform = {
                RECORD_TYPE: 'customrecord_sca_custom_config',
                RECORD_ID: 1,
                FIELDS_ID: ['custrecord_reg_fields_json', 'custrecord_up_fields_json'],
                FIELDS_NAME: ['registration_fields', 'upload_fields']
            };
        }else{

        }
        
        // log.debug("typeform",JSON.stringify(configform));
        return configform;
    }

    const isDefinedNotNullNotEmpty = (variable) => {
        return variable !== undefined && variable !== null && variable !== '' && (Array.isArray(variable) ? variable.length > 0 : true);
    }
        

    return {getFormType}
});