// 載入vue模組(如createApp)
import { createApp } from 'https://cdnjs.cloudflare.com/ajax/libs/vue/3.2.45/vue.esm-browser.min.js';

import pagination from './pagination.js';

// 路由(所有API網址的開頭)
const site = 'https://vue3-course-api.hexschool.io/v2/';
const api_path = 'jenny7532';

// 放全域，因為多個地方會使用到
let productModal = {};
let delProductModal = {};

// 把應用程式掛載在這個app上面
const app = createApp({
    data() {
        return {
            // 從API取回的產品資料放到products
            products: [],
            // 點擊畫面產品的"查看細節"按鈕，將其資料儲存到data的tempProduct
            tempProduct: {
                // 如果資料內層有物件或陣列結果，初始化時建議寫出來(如imagesUrl為陣列)
                imagesUrl: [],
            },
            // 用來確認是編輯或新增所使用
            isNew: false,
            // pagination(分頁)功能用
            page: {},
        };
    },
    methods: {
        checkLogin() {
            const loginCheckurl = `${site}api/user/check`;
            axios.post(loginCheckurl)
                .then(response => {
                    // 觸發函式getProducts()
                    this.getProducts();
                })
                .catch((error) => {
                    // 驗證登入是否具有此api_path權限，若否跳出登入失敗視窗
                    alert(error.data.message);
                    // 轉址(轉跳到指定頁面)
                    window.location = './login.html';
                });
        },
        // 取得產品列表
        getProducts(page = 1) { // ()內page=1為參數預設值
            const getProductsUrl = `${site}api/${api_path}/admin/products/?page=${page}`;
            axios.get(getProductsUrl)
                .then(response => {
                    // console.log(response);
                    this.products = response.data.products;
                    this.page = response.data.pagination;
                    // console.log(response.data.pagination);
                })
                .catch((error) => {
                    // console.dir(error);
                    alert(error.data.message);
                });
        },
        // 將html標籤內@click="openModal()"，括號內的參數帶入到函式openModal(status)的status
        openModal(status, product) {
            if (status === 'create') {
                // bootstrap互動視窗(Modal)
                // step2.呼叫model方法(如show、hide)
                productModal.show();
                // 此筆資料為新增的
                this.isNew = true;
                // 帶入初始化資料(如果新增前有編輯過任一產品內容，會導致新增產品視窗的欄位有剛的資料，所以必須初始化讓欄位都是空值)
                this.tempProduct = {
                    imagesUrl: [],
                };
                // console.log(this.tempProduct.imagesUrl);
            } else if (status === 'edit') {
                productModal.show();
                // 此筆資料不是新增的
                this.isNew = false;
                // 將當前要編輯的這筆資料帶入(利用v-for迴圈的product做參數帶入)
                // 利用淺層拷貝 展開寫法，讓編輯過的資料結果不會動到原始product內容。因為變更後的資料要透過修改產品API去做
                this.tempProduct = { ...product };
                // 編輯modal頁面，多圖新增與刪除圖片邏輯同「建立新的產品」
                if (!this.tempProduct.imagesUrl) {
                    this.tempProduct.imagesUrl = [];
                };
            } else if (status === 'delete') {
                delProductModal.show();
                // 取得當前要刪除的這筆資料(利用v-for迴圈的product做參數帶入)，給後面delProductsUrl中${this.tempProduct.id}的id使用
                this.tempProduct = { ...product };
            };
        },
        // 新增/編輯產品
        updateProduct() {
            let addProductsUrl = `${site}api/${api_path}/admin/product`;
            // 用this.isNew判斷要執行哪個API
            let method = 'post';

            // 當this.isNew為否，表示這筆資料要編輯，所以要用put的產品API
            if (!this.isNew) {
                addProductsUrl = `${site}api/${api_path}/admin/product/${this.tempProduct.id}`;
                method = 'put';
            };

            // 產品API資料都放在data物件裡面，所以要寫{ data: this.tempProduct }
            axios[method](addProductsUrl, { data: this.tempProduct })
                .then(response => {
                    // console.log(response.data);
                    // 新增/編輯完產品，再跑一次函式getProducts()，重新渲染畫面
                    this.getProducts();
                    // 新增/編輯完產品關閉modal
                    productModal.hide();
                })
                .catch(error => {
                    // console.dir(error);
                    alert(error.data.message);
                });
        },
        // 刪除產品
        deleteProduct() {
            const delProductsUrl = `${site}api/${api_path}/admin/product/${this.tempProduct.id}`;
            axios.delete(delProductsUrl)
                .then(response => {
                    // console.log(response.data);
                    // 刪除完產品，再跑一次函式getProducts()，重新渲染畫面
                    this.getProducts();
                    // 刪除完產品關閉modal
                    delProductModal.hide();
                })
                .catch(error => {
                    // console.dir(error);
                    alert(error.data.message);
                });
        },
    },
    components: {
        pagination,
    },
    mounted() {
        // 當cookie有儲存資料時，就能從cookie取出token
        const myCookie = document.cookie.replace(/(?:(?:^|.*;\s*)hexToken\s*\=\s*([^;]*).*$)|^.*$/, "$1");

        // 將Token內容夾帶到headers裡
        // 加入一次即可!!!後續axios會採用預設方式登入API
        // defaults表示每次發出token時，在headers加入屬性'Authorization'後方代入值(token)
        axios.defaults.headers.common['Authorization'] = myCookie;
        this.checkLogin();

        // bootstrap互動視窗(Modal)
        // step1.初始化new。()內填html標籤內的 id 名稱
        productModal = new bootstrap.Modal('#productModal');
        delProductModal = new bootstrap.Modal('#delProductModal');
    },
});

// 開頭用const app = Vue.createApp({})寫法，才能元件寫在全域上
app.component('product-modal', {
    // 把data中屬性tempProduct、methods的updateProduct與deleteProduct、isNew事件。均透過props把父層資料傳到子層元件內
    props:['tempProduct','updateProduct','deleteProduct','isNew'],
    template: `#product-modal-tempate`,
});


app.mount('#app');  // 生成在app這個位置
