import { LightningElement, track, wire } from "lwc";
//import { refreshApex } from "@salesforce/apex";
//import { getRecord, updateRecord, notifyRecordUpdateAvailable } from "lightning/uiRecordApi";
//import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getProducts from "@salesforce/apex/prodDataController.getProducts";
import { NavigationMixin } from 'lightning/navigation';
//import updateProducts from "@salesforce/apex/prodDataController.updateProducts";

// Set actions for datatable
// データテーブルにアクションを設定
const actions = [
  { label: '詳細', name: 'details' },
  { label: '削除', name: 'delete' },
];

// Set columns for step 1 datatable
// ステップ１のデータテーブルの列を設定
const cols1 = [
  { label: "商品名", fieldName: "Name", type: "text", sortable: true },
  { label: "販売価格", fieldName: "SalePrice__c", type: "currency" },
  { label: "数量", fieldName: "Amount__c", type: "number" },
  { label: "項目", fieldName: "ProductCategory__c", type: "picklist", sortable: true },
];

// Set columns for step 2 datatable
// ステップ２のデータテーブルの列を設定
const cols2 = [
  { label: "商品名", fieldName: "Name", type: "text", sortable: true },
  { label: "販売価格", fieldName: "SalePrice__c", type: "currency", editable: true },
  { label: "数量", fieldName: "Amount__c", type: "number", editable: true },
  { label: "項目", fieldName: "ProductCategory__c", type: "picklist", sortable: true },
  { type: 'action', typeAttributes: { rowActions: actions }, },
];


export default class ProductTable extends NavigationMixin(LightningElement) {
  @track data;
  @track holdData;
  @track columns = cols1;
  @track error;
  @track sortBy;
  @track sortDirection;

  // ----- Retrieve data and local sorting -----
  // ----- データの取得とローカル絞り込み -----

  // Pull object data and assign to "data"
  // オブジェクトのデータを取り出し、"data "に割り当てる
  /*   @wire(getProducts)
    product({ error, data }) {
      if (data) {
        console.log('Raw data: ', data);
        this.data = data;
        console.log('parsed data: ', this.data);
      } else if (error) {
        this.error = error;
      }
    } */

  connectedCallback() {
    // Call query in Apex class getProducts
    // ApexクラスのgetProductsでクエリを呼び出す
    getProducts()
      .then(result => {
        //console.log('connectedCallback is call with result');
        this.data = result;
        // duplicate data to recall when 戻る is clicked
        // 「戻る」をクリックしたときのための複製データを作る
        this.holdData = result;
        this.error = undefined;
        //console.log('loaded data: ', JSON.parse(JSON.stringify(this.data)));
      })
      .catch(error => {
        //console.log('connectedCallback is call with error');
        this.error = error;
        this.data = undefined
        this.holdData = undefined
      });
  }

  // Set sort column and direction
  // 絞り込みの列と方向を設定
  handleSortData(event) {
    this.sortBy = event.detail.fieldName;
    this.sortDirection = event.detail.sortDirection;
    this.sortData(this.sortBy, this.sortDirection);
  }

  // Parse data and sort
  // データの解析と並べ替え
  sortData(fieldname, direction) {
    let parseData = JSON.parse(JSON.stringify(this.data));
    //console.log('parsed data for sorting: ', parseData);
    let keyValue = (a) => {
      return a[fieldname];
    };
    let isReverse = direction === 'asc' ? 1 : -1;
    parseData.sort((x, y) => {
      x = keyValue(x) ? keyValue(x) : '';
      y = keyValue(y) ? keyValue(y) : '';
      return isReverse * ((x > y) - (y > x));
    });
    this.data = parseData;
  }


  // ----- Page controls -----
  // ----- ページコントロール -----

  // Set default step to 1
  // 標準ステップを１に設定
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
  // Next page
  // 次のページへ
  handleNext() {
    if (this.currentStep === '1') {
      this.currentStep = '2';
      // set columns for datatable 2 when 次へ is clicked
      // 次へをクリックしたときに、データテーブル２の欄を設定
      this.columns = cols2;
      this.getSelectedProducts();
    }
    //console.log('Page ', this.currentStep)
  }
  // Previous page
  // 前のページへ
  handlePrev() {
    if (this.currentStep === '2') {
      this.currentStep = '1';
      // set columns for datatable 1 when 戻る is clicked
      // 「戻る」をクリックしたときに、データテーブル１の欄を設定
      this.columns = cols1;
      // reset data to original when 戻る is clicked
      // 「戻る」をクリックしたときに、データを元に戻す
      this.data = this.holdData;
    }
    //console.log('Page ', this.currentStep);
  }


  // ----- Transfer selected rows -----
  // ----- 選択した行を転送 ------

  // Grab selected rows in step 1
  // ステップ1で選択された行を取得
  getSelectedProducts() {
    var selectedRecords = this.template.querySelector('lightning-datatable').getSelectedRows();
    //console.log('selectedRecords: ', selectedRecords);
    // Add selected rows to new datatable in step 2
    // ステップ２で選択した行を新しいデータテーブルに追加
    this.data = selectedRecords;
    //console.log('new dataset: ', this.data)
  }


  // ----- Row actions for datatable 2 -----
  // ----- データテーブル２の行アクション -----
  handleRowAction(event) {
    //console.log('■ ' + event.detail.action.name);
    let actionName = event.detail.action.name;
    let row = event.detail.row;
    // eslint-disable-next-line default-case
    switch (actionName) {
      case 'details':
        // Navigate to record detail page
        // レコードページに移動
        this[NavigationMixin.Navigate]({
          type: 'standard__recordPage',
          attributes: {
            recordId: row.Id,
            actionName: 'view'
          }
        });
        //console.log('selected row data: ', row)
        break;
      case 'delete':
        // Remove selected row from the datatable
        // データテーブルから選択された行を削除
        this.data = this.data.filter(row => row.Id !== event.detail.row.Id);
        //console.log(event.detail.row.Id);
        break;
    }
  }


  // UNDER CONSTRUCTION ----- Save Functionality ----- UNDER CONSTRUCTION
  // 開発中 ----- 保存機能 ----- 開発中

  @track draftValues = [];

  async handleSave(event) {
    this.draftValues = event.detail.draftValues
    //console.log('draftvalues: ', this.draftValues)

    this.data = this.data.map(originalRow => {
      // Find the corresponding draft value for the current row
      // 現在の行に対応するドラフト値を見つける
      const draftRow = this.draftValues.find(draft => draft.Id === originalRow.Id);

      // Check original data for matching value from draftValues and replace, otherwise keep original value
      // draftValuesから元データと一致する値をチェックし、置き換える。見つからない場合は、元の値を保持する。
      return draftRow ? { ...originalRow, ...draftRow } : originalRow;
    });
    //console.log('updated datatable: ', this.data);

    // Clear all datatable draft values
    // すべてのデータテーブルのドラフト値をクリアする
    this.draftValues = [];
  }


  /*   async handleSave(event) {
      const updatedFields = event.detail.draftValues;
  
      // Prepare the record IDs for notifyRecordUpdateAvailable()
      const notifyChangeIds = updatedFields.map(row => { return { "recordId": row.Id } });
  
      try {
        // Pass edited fields to the updateContacts Apex controller
        // 編集した項目を updateContacts Apex コントローラに渡す
        const result = await updateProducts({ data: updatedFields });
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

}