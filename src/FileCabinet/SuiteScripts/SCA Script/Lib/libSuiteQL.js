define(['N/query'],
    /**
     * @param{currentRecord} currentRecord
     * @param{query} query
     * @param{serverWidget} serverWidget
     */
    (query) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */


        const  runSuiteQL = (sql,params_value, pageSize ,pageNo) => {
            if(!pageSize) pageSize=5000;
            log.debug("pageSize", pageSize)
            log.debug("sql",sql)
            log.debug("params_value", params_value)
            let myPagedResults =query.runSuiteQLPaged({query: sql,params: params_value, pageSize: pageSize})

            log.debug("myPagedResults" ,myPagedResults);
            let results= [];

            for (var i = 0; i < myPagedResults.pageRanges.length; i++) {
                let currentPage = myPagedResults.fetch(i);
                if(i==pageNo-1 || !pageNo) {

                    for (let j = 0; j < currentPage.data.results.length; j++) {
                        results.push(currentPage.data.results[j].asMap());
                    }
                }
                //log.debug(currentPage.pageRange.size);
            }

            return results;

        }



        return {runSuiteQL}

    });