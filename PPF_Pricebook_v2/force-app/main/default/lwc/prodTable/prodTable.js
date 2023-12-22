import { LightningElement, track, api, wire } from "lwc";
//import { refreshApex } from "@salesforce/apex";
//import { getRecord, updateRecord, notifyRecordUpdateAvailable } from "lightning/uiRecordApi";
//import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getProducts from "@salesforce/apex/prodDataController.getProducts";
//import updateProducts from "@salesforce/apex/prodDataController.updateProducts";

// set columns for table
// テーブルの列を設定
const columns = [
  { label: "商品名", fieldName: "Name", type: "Text", sortable: true },
  {
    label: "販売価格",
    fieldName: "SalePrice__c",
    type: "Currency"
  },
  { label: "数量", fieldName: "Amount__c", type: "Number" },
  { label: "項目", fieldName: "ProductCategory__c", type: "Picklist", sortable: true }
];


export default class ProductTable extends LightningElement {


  /* @track data = [];
  @track columns = columns;
  @track sortedBy;
  @track sortedDirection;
  
  // retrieve data and assign it to data
  @wire(getShouhin)
  product ({ error, data }) {
    if (data) this.data = data;
    console.log(data);
    if (error) console.log(error);
  }
  
  handleSortData(event) {
    this.sortbyBy = event.detail.fieldName;
    this.sortDirection = event.detail.sortDirection;
    this.sortData(event.detail.fieldName, event.detail.sortDirection)
  }
  
  sortData(fieldname, direction) {
    let parseData = JSON.parse(JSON.stringify(this.data));
    let keyValue = (a) => {
      return a[fieldname];
    };
    let isReverse = direction === 'desc' ? 1 : -1;
    parseData.sort((x, y) => {
      x = keyValue(x) ? keyValue(x) : '';
      y = keyValue(y) ? keyValue(y) : '';
      return isReverse * ((x > y) - (y > x));
    });
    this.data = parseData;
  } */

  // ----- server-side data grab and sorting -----
  // ----- サーバー側のデータの取得と絞り込み -----
  @track data1 = [];
  @track data2 = [];
  @track columns = columns;
  @track sortBy = "ProductCategory__c";
  @track sortDirection = "asc";

  // grabs data using query in cls file, checks for errors and assigns data to correct variable
  // clsファイル内のクエリを使用してデータを取得し、エラーをチェックして、データを正しい変数に割り当て
  @wire(getProducts, { field: "$sortBy", sortOrder: "$sortDirection" })
  shouhinList({ error, data }) {
    if (data) {
      // JSON to make a deep copy
      // JSON deep copyを作成
      this.data1 = JSON.parse(JSON.stringify(data));
    } else if (error) {
      this.error = error;
    }
  }
  // sets user defined sorting column and direction
  // ユーザー定義の並べ替え列と方向を設定
  handleSortData(event) {
    let fieldname = event.detail.fieldName;
    let sortDirection = event.detail.sortDirection;
    // assign the values. triggers wire reload
    // 値を割り当て、 ワイヤーのリロードを実行
    this.sortBy = fieldname;
    this.sortDirection = sortDirection;
  }


  // ----- Page Controls -----
  // ----- ページコントロール -----
  @track currentStep = '1';

  get isStepOne() {
    return this.currentStep === '1';
  }
  get isStepTwo() {
    return this.currentStep === '2';
  }
  get isEnableNext() {
    return this.currentStep !== '2';
  }
  get isEnablePrev() {
    return this.currentStep !== '1';
  }
  get isEnableFinish() {
    return this.currentStep === '2';
  }
  // next page
  // 次のページへ
  handleNext() {
    console.log(this.currentStep);
    if (this.currentStep === '1') {
      this.currentStep = '2';
    }
  }
  // previous page
  // 前のページへ
  handlePrev() {
    if (this.currentStep === '2') {
      this.currentStep = '1';
    }
    console.log(this.currentStep);
  }

  // ----- save functionality -----
  // ----- 保存機能 -----
  @api recordId;
  @track draftValues = [];

  /*   handleSave(event) {
      this.draftValues = event.detail.draftValues;
      const inputsItems = this.draftValues.slice().map(draft => {
        const fields = Object.assign({}, draft)
        return { fields };
      });
  
      const promises = inputsItems.map(recordInput => updateRecord(recordInput));
          Promise.all(promises).then(res => {
              this.dispatchEvent(
                  new ShowToastEvent({
                      title: 'Success',
                      message: 'Records Updated Successfully!!',
                      variant: 'success'
                  })
              );
              this.draftValues = [];
              return this.refresh();
          }).catch(error => {
              this.dispatchEvent(
                  new ShowToastEvent({
                      title: 'Error',
                      message: 'An Error Occured!!',
                      variant: 'error'
                  })
              );
          }).finally(() => {
              this.draftValues = [];
          });
      }
  
      async refresh() {
          await refreshApex(this.data);
      } */


  /*   async handleSave(event) {
      // Convert datatable draft values into record objects
      const records = event.detail.draftValues.slice().map((draftValue) => {
        const fields = Object.assign({}, draftValue);
        return { fields };
      });
  
      // Clear all datatable draft values
      this.draftValues = [];
  
      try {
        // Update all records in parallel
        const recordUpdatePromises = records.map((record) => updateRecord(record));
        await Promise.all(recordUpdatePromises);
  
        // Report success with a toast
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Success",
            message: "records updated",
            variant: "success",
          }),
        );
  
        // Display fresh data in the datatable
        await refreshApex(this.data);
      } catch (error) {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Error updating or reloading records",
            message: error.body.message,
            variant: "error",
          }),
        );
      }
    } */


  /*   async handleSave(event) {
      const updatedFields = event.detail.draftValues;
  
      // Prepare the record IDs for notifyRecordUpdateAvailable()
      const notifyChangeIds = updatedFields.map(row => { return { "recordId": row.Id } });
  
      try {
        // Pass edited fields to the updateContacts Apex controller
        // 編集した項目を updateContacts Apex コントローラに渡す
        const result = await updateShouhin({ data: updatedFields });
        console.log(JSON.stringify("Apex update result: " + result));
        this.dispatchEvent(
          new ShowToastEvent({
            title: 'Success',
            message: 'Contact updated',
            variant: 'success'
          })
        );
  
        // Refresh LDS cache and wires
        // LDS キャッシュとワイヤーをリフレッシュ
        notifyRecordUpdateAvailable(notifyChangeIds);
  
        // Display fresh data in the datatable
        // データテーブル内の新しいデータを表示
        await refreshApex(this.data);
        // Clear all draft values in the datatable
        // データテーブル内のすべてのドラフト値をクリア
        this.draftValues = [];
  
      } catch (error) {
        this.dispatchEvent(
          new ShowToastEvent({
            title: 'Error updating or refreshing records',
            message: error.body.message,
            variant: 'error'
          })
        );
      }
    } */

}