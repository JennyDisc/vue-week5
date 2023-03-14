// 載入vue模組(如createApp)
// Vue 版本問題，改使用Vue.createApp替之，並且由html中<script>來引入Vue CDN
// import { createApp } from 'https://cdnjs.cloudflare.com/ajax/libs/vue/3.2.45/vue.esm-browser.min.js';

// 路由(所有API網址的開頭)
const site = 'https://vue3-course-api.hexschool.io/v2/';
const api_path = 'jenny7532';

// VeeValidation 表單驗證 start
// 定義規則(加入全部規則)(CDN版本)
Object.keys(VeeValidateRules).forEach(rule => {
    if (rule !== 'default') {
        VeeValidate.defineRule(rule, VeeValidateRules[rule]);
    }
});

// 加入VeeValidate的繁體中文語系檔
// 1.讀取外部的資源
VeeValidateI18n.loadLocaleFromURL('./zh_TW.json');

// 2.Activate the locale(將當前 VeeValidate語系設定為繁體中文)
VeeValidate.configure({
    generateMessage: VeeValidateI18n.localize('zh_TW'),
    validateOnInput: true, // 調整為：輸入文字時，就立即進行驗證(即邊寫邊判斷)
});
// VeeValidation 表單驗證 end

// 全域元件
const productModal = {
    // 接收父層/外層的id、addToCart
    // 當id變動時取得遠端資料，並呈現Modal
    props: ["id", "addToCart", "openModal"],
    data() {
        return {
            modal: {},
            tempProduct: {},
            qty: 1, // 給予一個預設值
        };
    },
    template: '#userProductModal',
    // 用watch監聽props傳入的id值。因為單一產品API需要id
    watch: {
        // 此id抓的是props的id值
        id() {
            // console.log("productModal: ", this.id);
            // 取得客戶所點擊的單一產品API
            const getProductsUrl = `${site}api/${api_path}/product/${this.id}`;
            // 當產品id存在才執行
            if (this.id) {
                axios.get(getProductsUrl)
                    .then(response => {
                        // console.log("單一產品: ", response.data.product);
                        this.tempProduct = response.data.product;
                        this.modal.show();
                    })
                    .catch((error) => {
                        // console.dir(error);
                        alert(error.data.message);
                    });
            };
        },
    },
    methods: {
        // 關閉"查看更多"的modal並且數量初始化=1
        hide() {
            this.modal.hide(); // modal內加入購物車後，就自動關閉modal
            this.qty = 1;
        },
    },
    mounted() {
        // bootstrap互動視窗(Modal)
        // step1.透過bootstrap.Modal建立一個實體，並賦予到變數modal上
        // $refs 外層透過ref取得內層資料
        this.modal = new bootstrap.Modal(this.$refs.modal);

        // 按鈕"查看更多"按第兩次時modal不會跳出來，因為產品id沒變，所以要讓modal關閉時清空產品id
        // 監聽DOM，當modal關閉時...要做其他事情(程式碼參考bs5/modal/事件)
        this.$refs.modal.addEventListener('hidden.bs.modal', (event) => {
            // 透過外層傳到內層的方式把openModal內的參數傳入一個空值，去清空產品id
            this.openModal('');
        });
    },
};

// 把應用程式掛載在這個app上面
const app = Vue.createApp({
    data() {
        return {
            // 從API取回的產品資料放到products
            products: [],
            productId: "",
            cart: {},
            loadingItem: "", // 儲存產品id
            form: {
                user: {
                    name: '',
                    email: '',
                    tel: '',
                    address: '',
                },
                message: '',
            },
            isLoading: false,
        };
    },
    methods: {
        // 取得產品列表
        getProducts() { // ()內page=1為參數預設值
            const getProductsUrl = `${site}api/${api_path}/products/all`;
            axios.get(getProductsUrl)
                .then(response => {
                    // console.log(response.data.products);
                    this.products = response.data.products;
                })
                .catch((error) => {
                    // console.dir(error);
                    alert(error.data.message);
                });
        },
        openModal(id) {
            this.productId = id;
            // console.log("外層帶入id: ", id);
        },
        // 增加購物車內產品數量
        addToCart(product_id, qty = 1) { // 當沒有傳入qty參數時就使用預設值1代入
            const data = {
                // 縮寫。完整寫法為product_id:product_id,
                product_id,
                qty,  // 上面qty沒寫預設值的話這邊會顯示undefined
            };
            // {data}為縮寫(屬性名稱與賦值相同，可以寫一個就行)，完整寫法為{data:data}。{}是照著客戶購物車API資料格式寫的
            axios.post(`${site}api/${api_path}/cart`, { data })
                .then(response => {
                    // console.log("加入購物車: ", response.data);
                    this.$refs.productModal.hide(); // 操作內層元件方法
                    this.getCarts();
                    alert("已加入購物車!");
                })
                .catch((error) => {
                    // console.dir(error);
                    alert("加入購物車失敗!!");
                });
        },
        // 取得購物車列表
        getCarts() {
            axios.get(`${site}api/${api_path}/cart`)
                .then(response => {
                    // console.log("購物車: ", response.data);
                    this.cart = response.data.data;
                })
                .catch((error) => {
                    // console.dir(error);
                    alert(error.data.message);
                });
        },
        // 更動購物車內單一產品的數量
        updataCartItem(item) { // 第一個API的id是購物車id，第二個product_id是產品id
            const data = {
                product_id: item.product.id,
                qty: item.qty,
            };
            this.loadingItem = item.id;
            axios.put(`${site}api/${api_path}/cart/${item.id}`, { data })
                .then(response => {
                    // console.log("更新購物車: ", response.data);
                    // 重新取得購物車列表
                    this.getCarts();
                    // 更新完購物車單一產品數量後，清空this.loadingItem
                    this.loadingItem = "";
                    alert("該產品數量調整成功!");
                })
                .catch((error) => {
                    // console.dir(error);
                    alert("該產品數量調整失敗!!");
                });
        },
        // 刪除購物車內的單一產品
        deleteItem(item) {
            this.loadingItem = item.id;
            axios.delete(`${site}api/${api_path}/cart/${item.id}`)
                .then(response => {
                    // console.log("刪除購物車: ", response.data);
                    // 重新取得購物車列表
                    this.getCarts();
                    // 刪除完購物車單一產品數量後，清空this.loadingItem
                    this.loadingItem = "";
                    alert("購物車已移除該品項!");
                })
                .catch((error) => {
                    // console.dir(error);
                    alert("購物車移除該品項失敗!!");
                });
        },
        // 清空購物車
        deleteCarts() {
            axios.delete(`${site}api/${api_path}/carts`)
                .then(response => {
                    // console.log("清空購物車: ", response.data);
                    // 重新取得購物車列表
                    this.getCarts();
                    alert("購物車已清空!");
                })
                .catch((error) => {
                    // console.dir(error);
                    alert("購物車清空失敗!!");
                });
        },
        // 自訂驗證規則-電話
        isPhone(value) {
            const phoneNumber = /^(09)[0-9]{8}$/
            return phoneNumber.test(value) ? true : '需填入正確的手機號碼'
        },
        // 表單送出按鈕
        submitOrder() {
            const order = this.form;
            axios.post(`${site}api/${api_path}/order`, { data: order })
                .then(response => {
                    // console.log("訂單: ", response.data);
                    alert("訂單提交成功!");
                    // 提交表單後清空表單欄位(初始化)
                    this.$refs.form.resetForm();
                    // 重新取得購物車列表
                    this.getCarts();
                })
                .catch((error) => {
                    // console.dir(error);
                    // 結帳API有設定購物車沒品項不能提單
                    alert("訂單提交失敗，請聯繫客服人員!!");
                });
        },
    },
    // 區域註冊
    components: {
        productModal,
    },
    mounted() {
        // 關閉loading效果
        this.isLoading = true;
        setTimeout(() => {
            this.isLoading = false
        }, 1000);  // loading執行1秒後關閉

        this.getProducts();
        this.getCarts();
    },
});

// 註冊全域的表單驗證元件（VForm, VField, ErrorMessage）
app.component('VForm', VeeValidate.Form);
app.component('VField', VeeValidate.Field);
app.component('ErrorMessage', VeeValidate.ErrorMessage);

// 元件方式註冊
app.component('loading', VueLoading.Component);

app.mount('#app');  // 生成在app這個位置