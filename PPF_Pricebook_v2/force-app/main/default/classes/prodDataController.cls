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
                SELECT Id, Name, SalePrice__c, TaxedPrice__c, TaxFreePrice__c, TaxRate__c, Amount__c, ProductCategory__c 
                FROM Product__c
                WITH SECURITY_ENFORCED
                ];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }


    @AuraEnabled(cacheable=true)
    public static string updateProducts(Object data){
        List<Product__c> productForUpdate = (List<Product__c>) JSON.deserialize(
            JSON.serialize(data),
            List<Product__c>.class
        );
        System.debug(List<Product__c>.class);
        try {
            update productForUpdate;
            System.debug(productForUpdate);
            return 'Success: product updated successfully';
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}