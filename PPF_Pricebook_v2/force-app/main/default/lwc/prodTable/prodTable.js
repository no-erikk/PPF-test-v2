import { LightningElement, track, api } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { CloseActionScreenEvent } from "lightning/actions";
import getProducts from "@salesforce/apex/prodDataController.getProducts";
import createRecords from "@salesforce/apex/prodDataController.createRecords";
import { NavigationMixin } from "lightning/navigation";
import { RefreshEvent } from "lightning/refresh";

// Set actions for datatable
// データテーブルにアクションを設定する
const actions = [
  { label: '詳細', name: 'details' },
  { label: '削除', name: 'delete' },
];

// Set columns for step 1 datatable
// ステップ１のデータテーブルの列を設定する
const cols1 = [
  { label: "商品名", fieldName: "Name", type: "text", sortable: true },
  { label: "販売価格", fieldName: "SalePrice__c", type: "currency" },
  { label: "数量", fieldName: "Amount__c", type: "number" },
  { label: "項目", fieldName: "ProductCategory__c", type: "picklist", sortable: true },
];

// Set columns for step 2 datatable
// ステップ２のデータテーブルの列を設定する
const cols2 = [
  { label: "商品名", fieldName: "Name", type: "text", sortable: true },
  { label: "販売価格", fieldName: "SalePrice__c", type: "currency", editable: true },
  { label: "数量", fieldName: "Amount__c", type: "number", editable: true },
  { label: "項目", fieldName: "ProductCategory__c", type: "picklist", sortable: true },
  { type: 'action', typeAttributes: { rowActions: actions }, },
];


export default class ProductTable extends NavigationMixin(LightningElement) {
  // recordId corresponds to the ID of the record page the modal was launched from
  // recordIdは、モーダルが起動されたレコード ページのIDに対応します。
  @api recordId;
  @track data; // データテーブル
  @track holdData; // 元データテーブルのコピー
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
        // Duplicate data to recall when 戻る is clicked
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
  // 絞り込みの列と方向を設定する
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
  // 標準ステップを１に設定する
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
      // To properly handle errors, code to move to the next page has been integraded with getSelectedProducts
      // エラーを適切に処理するために、次のページに移動するコードがgetSelectedProductsに統合されました。
      this.getSelectedProducts();
    }
    //console.log('Page ', this.currentStep)
  }
  // Previous page
  // 前のページへ
  handlePrev() {
    if (this.currentStep === '2') {
      this.currentStep = '1';
      // Set columns for datatable 1 when 戻る is clicked
      // 「戻る」をクリックしたときに、データテーブル１の欄を設定する
      this.columns = cols1;
      // Reset data to original when 戻る is clicked
      // 「戻る」をクリックしたときに、データを元に戻す
      this.data = this.holdData;
    }
    //console.log('Page ', this.currentStep);
  }


  // ----- Transfer selected rows -----
  // ----- 選択した行を転送する ------


  getSelectedProducts() {
    // Grab selected rows in step 1
    // ステップ1で選択された行を取得する
    var selectedRecords = this.template.querySelector('lightning-datatable').getSelectedRows();
    //console.log('selectedRecords: ', selectedRecords);
    // Check that selectedRecords is not empty
    // selectedRecordsが空でないことを確認する
    if (selectedRecords.length > 0) {
      // Add selected rows to new datatable in step 2
      // ステップ２で選択した行を新しいデータテーブルに追加する
      this.data = selectedRecords;
      // Set columns for datatable 2 when 次へ is clicked
      // 次へをクリックしたときに、データテーブル２の欄を設定する
      this.columns = cols2;
      // Set current step to 2 if selectedRecords is not empty
      // selectedRecordsが空でなければ、現在のステップを2に設定する
      this.currentStep = '2';
    } else {
      // If selectedRecords is empty, stay on page 1, reset data, and display error message
      // selectedRecordsが空の場合、1ページに留まり、データをリセットし、エラーメッセージを表示する
      this.data = this.holdData;
      this.currentStep = '1';
      this.dispatchEvent(
        new ShowToastEvent({
          title: 'Error',
          message: '選択された商品はありません。',
          variant: 'error'
        }),
      );
    }
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
        if (this.data.length === 0) {
          this.data = this.holdData;
          this.currentStep = '1';
          this.dispatchEvent(
            new ShowToastEvent({
              title: 'Error',
              message: '選択された商品はありません。',
              variant: 'error'
            }),
          );
        }
        break;
    }
  }


  // ----- Save User Edited Fields -----
  // ----- ユーザー編集フィールドの保存 -----

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
  }


  // ----- Create New QuoteLineItem__c records for each line in the datatable -----
  // ----- データテーブルの各行について、新しいQuoteLineItem__cレコードを作成する -----
  createLineItem() {
    let quoteLineItemFields = []

    // Assign values from Product__c to the corresponding fields in QuoteLineItem__c
    // Product__cの値をQuoteLineItem__c の対応するフィールドに代入する
    this.data.forEach(row => {
      quoteLineItemFields.push({
        //Cost__c: undefined, // Flowで追加される計算フィールド
        //TaxFreePrice__c: undefined, // Flowで追加される計算フィールド
        //LineItemTotal__c: undefined, // Flowで追加される計算フィールド
        Product2__c: row.Id,
        ProductCategory__c: row.ProductCategory__c,
        Quantity__c: row.Amount__c,
        TaxRate__c: row.TaxRate__c,
        QuoteMaster__c: this.recordId,
        Name: row.Name,
        SalePrice__c: row.SalePrice__c
      });
    });
    //console.log('Fields for Record Input: ', quoteLineItemFields)

    // Pass assigned values to prodDataController to create records via Apex
    // Apexでレコードを作成するために、prodDataControllerに代入された値を渡す
    createRecords({ objectName: 'QuoteLineItem__c', dataList: quoteLineItemFields })
      .then(() => {
        this.dispatchEvent(
          // Show success message
          // 成功メッセージを表示
          new ShowToastEvent({
            title: 'Success',
            message: 'お見積もりに追加しました。',
            variant: 'success'
          }),
        );
        //console.log('Record created successfully:', result);

        // Clear all datatable draft values
        // すべてのデータテーブルのドラフト値をクリアする
        this.draftValues = [];

        // Refresh record page UI to show new data
        this.dispatchEvent(new RefreshEvent());

        // Close modal
        // モーダルを閉じる
        this.dispatchEvent(new CloseActionScreenEvent());
      })
      .catch(error => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: 'Error',
            message: 'An error has occurred.',
            variant: 'error'
          })
        );
        console.error('Error creating record:', error);
      });
  }

}