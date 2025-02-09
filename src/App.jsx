console.clear();
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { Modal } from 'bootstrap';
import Swal from "sweetalert2";

const baseApi = import.meta.env.VITE_BASE_URL;
const apiPath = import.meta.env.VITE_API_PATH;

// 預設表單資料
const defaultModalState = {
    imageUrl: "",
    title: "",
    category: "",
    unit: "",
    origin_price: "",
    price: "",
    description: "",
    content: "",
    is_enabled: 0,
    imagesUrl: [""]
};

function App() {
    const [isAuth, setIsAuth] = useState(false);
    const [account, setAccount] = useState({
        "username": "user@exapmle.com",
        "password": "example"
    });

    const [resErrMessage, setResErrMessage] = useState("");
    const [products, setProducts] = useState([]);
    const [tempProduct, setTempProduct] = useState(defaultModalState);
    const [ModalMode, setModalMode] = useState(null);
    const productModalRef = useRef(null);
    const delproductModalRef = useRef(null);

    // 處理登入的input
    const handleSignInInputChange = (e) => {
        const { value, name } = e.target;
        setAccount({
            ...account,
            [name]: value
        });
    };

    // 處理產品Modal的input
    const handleModalInputChange = (e) => {
        const { value, name, checked, type } = e.target;

        setTempProduct({
            ...tempProduct,
            [name]: type === "checkbox" ? checked : value
        });
    };

    // 處理副圖輸入 - 更新時的監聽
    const handleModalImagesInputChange = (e, index) => {
        const { value } = e.target;
        const newImages = [...tempProduct.imagesUrl];
        newImages[index] = value;

        setTempProduct({
            ...tempProduct,
            imagesUrl: newImages
        });
    };

    // 處理副圖輸入 - 新增圖片按鈕的狀態
    const handleAddImage = () => {
        const newImages = [...tempProduct.imagesUrl, ''];

        setTempProduct({
            ...tempProduct,
            imagesUrl: newImages
        });
    };

    // 處理副圖輸入 - 取消圖片按鈕的狀態
    const handleRemoveImage = () => {
        const newImages = [...tempProduct.imagesUrl];
        newImages.pop();

        setTempProduct({
            ...tempProduct,
            imagesUrl: newImages
        });
    };

    // 監聽登入按鈕
    const handleSingIn = async (e) => {
        e.preventDefault(); // 可用此方式將預設行為取消掉，讓使用者可以直接按enter就可進入，不限制只透過按鈕點選
        try {
            const res = await axios.post(`${baseApi}/v2/admin/signin`, account);
            const { token, expired } = res.data;
            document.cookie = `signInHexoToken = ${token}; expires = ${new Date(expired)}`;
            axios.defaults.headers.common['Authorization'] = token;
            getProducts();
            setIsAuth(true);
        }
        catch (error) {
            setResErrMessage(error.response?.data?.message);
            console.error(error);
        }
    };

    // 抓取產品資料
    const getProducts = async () => {
        try {
            const res = await axios.get(`${baseApi}/v2/api/${apiPath}/admin/products`);
            setProducts(res.data.products);
        }
        catch (error) {
            console.error(error);
        }
    };

    // 驗證登入
    const authSignIn = async (e) => {
        try {
            await axios.post(`${baseApi}/v2/api/user/check`);
            getProducts();
            setIsAuth(true);
        }
        catch (error) {
            console.error(error);
        }
    };

    // 新增產品
    const addProduct = async () => {
        try {
            const res = await axios.post(`${baseApi}/v2/api/${apiPath}/admin/product`, {
                data: {
                    ...tempProduct,
                    origin_price: Number(tempProduct.origin_price),
                    price: Number(tempProduct.price),
                    is_enabled: tempProduct.is_enabled ? 1 : 0
                }
            });
            return res;
        }
        catch (error) {
            Swal.fire({
                title: `新增失敗`,
                text: `${error.response.data.message}`,
                icon: "error"
            });
        }
    };

    // 更新產品
    const updateProduct = async () => {
        try {
            const res = await axios.put(`${baseApi}/v2/api/${apiPath}/admin/product/${tempProduct.id}`, {
                data: {
                    ...tempProduct,
                    origin_price: Number(tempProduct.origin_price),
                    price: Number(tempProduct.price),
                    is_enabled: tempProduct.is_enabled ? 1 : 0
                }
            });
            return res;
        }
        catch (error) {
            Swal.fire({
                title: `更新失敗`,
                text: `${error.response.data.message}`,
                icon: "error"
            });
            throw error;
        }
    };

    // 刪除產品
    const deleteProduct = async () => {
        try {
            await axios.delete(`${baseApi}/v2/api/${apiPath}/admin/product/${tempProduct.id}`);
        }
        catch (error) {
            console.error(error);
        }
    };

    // Modal - 編輯及新增 的確認按鈕監聽
    const handleProduct = async () => {
        const apiCall = ModalMode === 'create' ? addProduct : updateProduct;
        try {
            const res = await apiCall();
            if (res && res.data.success) {
                getProducts();
                handleHideProductModal();
            }
        } catch (error) {
            // console.error(error);
        }
    };

    // Modal - 刪除的確認按鈕監聽
    const handleDelProduct = async () => {
        await deleteProduct();
        getProducts();
        handleHideDelProductModal();
    };

    // 顯示Modal - 編輯跟新增
    const handleShowProductModal = (mode, product) => {
        setModalMode(mode);
        if (mode == 'edit') {
            setTempProduct(product);
        }
        else if (mode == 'create') {
            setTempProduct(defaultModalState);
        }
        const modalInstance = Modal.getInstance(productModalRef.current);
        modalInstance.show();
    };

    // 隱藏Modal - 編輯跟新增
    const handleHideProductModal = () => {
        const modalInstance = Modal.getInstance(productModalRef.current);
        modalInstance.hide();
    };

    // 顯示Modal - 刪除
    const handleShowDelProductModal = (product) => {
        setTempProduct(product);
        const modalInstance = Modal.getInstance(delproductModalRef.current);
        modalInstance.show();
    };

    // 隱藏Modal - 刪除
    const handleHideDelProductModal = () => {
        const modalInstance = Modal.getInstance(delproductModalRef.current);
        modalInstance.hide();
    };

    useEffect(() => {
        const token = document.cookie.replace(
            /(?:(?:^|.*;\s*)signInHexoToken\s*\=\s*([^;]*).*$)|^.*$/,
            "$1",
        );
        axios.defaults.headers.common['Authorization'] = token;
        authSignIn();
    }, []); // []代表只戳一次

    useEffect(() => {
        // console.log(productModalRef.current); // 確認是否有抓到資料
        new Modal(productModalRef.current, {
            backdrop: false
        }); //從boostrap裡面來的

        new Modal(delproductModalRef.current, {
            backdrop: false
        }); //從boostrap裡面來的
    }, []);

    return (
        <>
            {
                isAuth ? (<div className="container">
                    <div className="row mt-3">
                        <div className="col">
                            <div className="d-flex justify-content-between">
                                <h2>產品列表</h2>
                                <button className="btn btn-primary" onClick={() => handleShowProductModal('create')}>
                                    新增產品
                                </button>
                            </div>
                            <table className="table text-center table-striped table-hover">
                                <thead>
                                    <tr>
                                        <th>產品名稱</th>
                                        <th>原價</th>
                                        <th>售價</th>
                                        <th>是否啟用</th>
                                        <th>管理</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.title}</td>
                                            <td>{item.origin_price}</td>
                                            <td>{item.price}</td>
                                            <td>{item.is_enabled ? (<span className="text-success">啟用</span>) : (<span className="text-danger">未啟用</span>)}</td>
                                            <td>
                                                <div className="btn-group">
                                                    <button
                                                        className="btn btn-outline-primary btn-sm"
                                                        onClick={() => handleShowProductModal('edit', item)}
                                                    >
                                                        編輯
                                                    </button>
                                                    <button
                                                        className="btn btn-outline-danger btn-sm"
                                                        onClick={() => handleShowDelProductModal(item)}
                                                    >
                                                        刪除
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>) :
                    (<div className="d-flex flex-column justify-content-center align-items-center vh-100">
                        <h2 className="mb-4">請先登入</h2>
                        <form onSubmit={handleSingIn}>
                            {/* 通常form會把送出時的資料放在form裡面，而不是用一按鈕去做觸發 */}
                            <div className="form-group">
                                <label htmlFor="exampleInputEmail2">電子郵件</label>
                                <input
                                    name="username"
                                    value={account.username}
                                    type="email"
                                    className="form-control"
                                    id="exampleInputEmail2"
                                    placeholder="請輸入信箱"
                                    onChange={handleSignInInputChange}
                                />
                            </div>
                            <div className="form-group my-3">
                                <label htmlFor="exampleInputPassword2">密碼</label>
                                <input
                                    name="password"
                                    value={account.password}
                                    type="password"
                                    className="form-control"
                                    id="exampleInputPassword2"
                                    placeholder="請輸入密碼"
                                    onChange={handleSignInInputChange}
                                />
                            </div>
                            {resErrMessage && (<p className="text-danger" >{resErrMessage}</p>)}
                            <button className="btn btn-success" >
                                登入
                            </button>
                        </form>
                    </div>)
            }
            <div ref={productModalRef} id="productModal" className="modal" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                <div className="modal-dialog modal-dialog-centered modal-xl">
                    <div className="modal-content border-0 shadow">
                        <div className="modal-header border-bottom">
                            <h5 className="modal-title fs-4">{ModalMode === 'edit' ? "編輯產品" : "新增產品"}</h5>
                            <button onClick={() => handleHideProductModal()} type="button" className="btn-close" aria-label="Close"></button>
                        </div>

                        <div className="modal-body p-4">
                            <div className="row g-4">
                                <div className="col-md-4">
                                    <div className="mb-4">
                                        <label htmlFor="primary-image" className="form-label">
                                            主圖
                                        </label>
                                        <div className="input-group">
                                            <input
                                                value={tempProduct.imageUrl}
                                                onChange={handleModalInputChange}
                                                name="imageUrl"
                                                type="text"
                                                id="primary-image"
                                                className="form-control"
                                                placeholder="請輸入圖片連結"
                                            />
                                        </div>
                                        <img
                                            src={tempProduct.imageUrl ? tempProduct.imageUrl : null}
                                            alt={tempProduct.title}
                                            className="img-fluid"
                                        />
                                    </div>

                                    {/* 副圖 */}
                                    <div className="border border-2 border-dashed rounded-3 p-3">
                                        {tempProduct.imagesUrl?.map((image, index) => (
                                            <div key={index} className="mb-2">
                                                <label
                                                    htmlFor={`imagesUrl-${index + 1}`}
                                                    className="form-label"
                                                >
                                                    副圖 {index + 1}
                                                </label>
                                                <input
                                                    value={image}
                                                    onChange={(e) => handleModalImagesInputChange(e, index)}
                                                    id={`imagesUrl-${index + 1}`}
                                                    type="text"
                                                    placeholder={`圖片網址 ${index + 1}`}
                                                    className="form-control mb-2"
                                                />
                                                {image && (
                                                    <img
                                                        src={image}
                                                        alt={`副圖 ${index + 1}`}
                                                        className="img-fluid mb-2"
                                                    />
                                                )}
                                            </div>
                                        ))}
                                        <div className="btn-group w-100">
                                            {tempProduct.imagesUrl.length < 5 &&
                                                tempProduct.imagesUrl[tempProduct.imagesUrl.length - 1] !== '' &&
                                                <button onClick={handleAddImage} className="btn btn-outline-primary btn-sm w-100">新增圖片</button>
                                            }
                                            {
                                                tempProduct.imagesUrl.length > 1 &&
                                                <button onClick={handleRemoveImage} className="btn btn-outline-danger btn-sm w-100">取消圖片</button>
                                            }

                                        </div>
                                    </div>
                                </div>

                                <div className="col-md-8">
                                    <div className="mb-3">
                                        <label htmlFor="title" className="form-label">
                                            標題
                                        </label>
                                        <input
                                            value={tempProduct.title}
                                            onChange={handleModalInputChange}
                                            name="title"
                                            id="title"
                                            type="text"
                                            className="form-control"
                                            placeholder="請輸入標題"
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="category" className="form-label">
                                            分類
                                        </label>
                                        <input
                                            value={tempProduct.category}
                                            onChange={handleModalInputChange}
                                            name="category"
                                            id="category"
                                            type="text"
                                            className="form-control"
                                            placeholder="請輸入分類"
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="unit" className="form-label">
                                            單位
                                        </label>
                                        <input
                                            value={tempProduct.unit}
                                            onChange={handleModalInputChange}
                                            name="unit"
                                            id="unit"
                                            type="text"
                                            className="form-control"
                                            placeholder="請輸入單位"
                                        />
                                    </div>

                                    <div className="row g-3 mb-3">
                                        <div className="col-6">
                                            <label htmlFor="origin_price" className="form-label">
                                                原價
                                            </label>
                                            <input
                                                value={tempProduct.origin_price}
                                                onChange={handleModalInputChange}
                                                name="origin_price"
                                                id="origin_price"
                                                type="number"
                                                className="form-control"
                                                placeholder="請輸入原價"
                                                min={0}
                                            />
                                        </div>
                                        <div className="col-6">
                                            <label htmlFor="price" className="form-label">
                                                售價
                                            </label>
                                            <input
                                                value={tempProduct.price}
                                                onChange={handleModalInputChange}
                                                name="price"
                                                id="price"
                                                type="number"
                                                className="form-control"
                                                placeholder="請輸入售價"
                                                min={0}
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="description" className="form-label">
                                            產品描述
                                        </label>
                                        <textarea
                                            value={tempProduct.description}
                                            onChange={handleModalInputChange}
                                            name="description"
                                            id="description"
                                            className="form-control"
                                            rows={4}
                                            placeholder="請輸入產品描述"
                                        ></textarea>
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="content" className="form-label">
                                            說明內容
                                        </label>
                                        <textarea
                                            value={tempProduct.content}
                                            onChange={handleModalInputChange}
                                            name="content"
                                            id="content"
                                            className="form-control"
                                            rows={4}
                                            placeholder="請輸入說明內容"
                                        ></textarea>
                                    </div>

                                    <div className="form-check">
                                        <input
                                            checked={tempProduct.is_enabled}   // checked 才代表是否被勾選的狀態
                                            onChange={handleModalInputChange}
                                            name="is_enabled"
                                            type="checkbox"
                                            className="form-check-input"
                                            id="isEnabled"
                                        />
                                        <label className="form-check-label" htmlFor="isEnabled">
                                            是否啟用
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer border-top bg-light">
                            <button type="button" className="btn btn-secondary" onClick={() => handleHideProductModal()}>
                                取消
                            </button>
                            <button type="button" className="btn btn-primary" onClick={() => handleProduct()}>
                                確認
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div
                ref={delproductModalRef}
                className="modal fade"
                id="delProductModal"
                tabIndex="-1"
                style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            >
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h1 className="modal-title fs-5">刪除產品</h1>
                            <button
                                onClick={handleHideDelProductModal}
                                type="button"
                                className="btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                            ></button>
                        </div>
                        <div className="modal-body">
                            你是否要刪除
                            <span className="text-danger fw-bold"> {tempProduct.title}</span>
                        </div>
                        <div className="modal-footer">
                            <button
                                onClick={handleHideDelProductModal}
                                type="button"
                                className="btn btn-secondary"
                            >
                                取消
                            </button>
                            <button onClick={handleDelProduct} type="button" className="btn btn-danger">
                                刪除
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>

    );
};


export default App;