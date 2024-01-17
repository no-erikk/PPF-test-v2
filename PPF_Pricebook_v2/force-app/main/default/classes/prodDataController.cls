public with sharing class prodDataController {
/*     // data retrieval for server side sorting (dynamic)
    // サーバー側の絞り込み向けるのためのデータ取得 (動的)
    @AuraEnabled(cacheable=true)
    public static List<Product__c> getProducts(String field, String sortOrder) {
        try {
            return Database.query('SELECT Id, Name, Amount__c, SalePrice__c, ProductCategory__c FROM Product__c ORDER BY '+field+' '+sortOrder);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    } */

    // data retrieval for local sorting
    // ローカル絞り込みのためのデータ取得
    @AuraEnabled(cacheable=true)
    public static List<Product__c> getProducts() {
        try {
            return [
                SELECT Id, Name, SalePrice__c, TaxedPrice__c, TaxFreePrice__c, Cost__c, TaxRate__c, Amount__c, ProductCategory__c
                FROM Product__c
                WITH SECURITY_ENFORCED
                ORDER BY Name ASC
                ];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }


    @AuraEnabled
    public static List<Id> createRecords(String objectName, List<Map<String, Object>> dataList){
        try {
            List<Id> createdRecordIds = new List<Id>();

        for (Map<String, Object> data : dataList) {
            SObject newRecord = (SObject)Type.forName('Schema.' + objectName).newInstance();

            for (String fieldName : data.keySet()) {
                // Get the field describe result to determine the field type
                // フィールドの記述結果を取得し、フィールドタイプを決定する
                Schema.DescribeFieldResult fieldDescribe = newRecord.getSObjectType().getDescribe().fields.getMap().get(fieldName).getDescribe();

                // Cast the value based on the field type
                // フィールドタイプに基づいて値をキャストする
                Object value = data.get(fieldName);

                if (fieldDescribe.getType() == Schema.DisplayType.String) {
                    newRecord.put(fieldName, String.valueOf(value));
                } else if (fieldDescribe.getType() == Schema.DisplayType.Integer) {
                    newRecord.put(fieldName, Integer.valueOf(String.valueOf(value)));
                } else if (fieldDescribe.getType() == Schema.DisplayType.Double || fieldDescribe.getType() == Schema.DisplayType.Percent) {
                    newRecord.put(fieldName, Double.valueOf(String.valueOf(value)));
                } else if (fieldDescribe.getType() == Schema.DisplayType.Currency) {
                    newRecord.put(fieldName, Decimal.valueOf(String.valueOf(value)));
                } else {
                    newRecord.put(fieldName, value);
                }
            }

            insert newRecord;
            createdRecordIds.add(newRecord.Id);
        }

        return createdRecordIds;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
            System.debug(e);
        }
    }



}