import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from 'axios'


export const ShopContext = createContext()

const ShopContextProvider = ({children}) =>{
    
    const backendURL = import.meta.env.VITE_BACKEND_URL

    const [token , setToken] = useState(localStorage.getItem('token') || '')
    const currency = '$';
    const deliveryFee = 10;
    const [search , setSearch] = useState("");
    const [showSearch,setShowSearch] = useState(false)
    const [cartItems , setCartItems] = useState({})
    const navigate = useNavigate() 
    const [products , setProducts] = useState([])
    const [retryCount, setRetryCount] = useState(0);
    const [loading , setLoading]  = useState(false)

    const addToCart = async (itemId , size) =>{
        if(!size){
            toast.error('Select Product Size')
            return 
        }
        let cartData = structuredClone(cartItems)
        if(cartData[itemId]){
            if(cartData[itemId][size]){
                cartData[itemId][size] +=1
            }else{
                cartData[itemId][size] = 1;
            }
        }else{
            cartData[itemId] = {};
            cartData[itemId][size] = 1;
        }
        setCartItems(cartData)

        if(token) {
            console.log(token)
            try {
                const response = await axios.post(backendURL + "/api/cart/add" , {itemId,size} , {headers : {token}})
                console.log(response.data)
            } catch (error) {
                console.log(error.message)
                toast.error(error.message)
            }
        }
    }
    
    const getCartCount = () =>{
        let totalCount = 0;
        for(const items in cartItems){
            for(const item in cartItems[items]){
                try{
                    if(cartItems[items][item] > 0){
                        totalCount += cartItems[items][item]
                    }
                } catch(error){
                    console.log(error.message())
                }
            }
        } 
        return totalCount
    }

    const updateQuantity = async (itemId , size , quantity) =>{
        let cartCopy = structuredClone(cartItems)
        cartCopy[itemId][size] = quantity
        setCartItems(cartCopy)
        if (token) {
            try {
                await axios.post(backendURL + "/api/cart/update" , {itemId , size , quantity} , {headers : {token}})
            } catch (error) {
                console.log(error.message)
                toast.error(error.message)
            }
        }
    }

    const getCartAmount =  () => {
        let totalAmount = 0
        for(const items in cartItems){
            let itemInfo =  products.find(product => product._id === items)
            for(const item in cartItems[items]){
                try{
                    if(cartItems[items][item] > 0){
                        totalAmount += itemInfo.price * cartItems[items][item];
                    }
                }catch(e){
                    console.log(e.message)
                }
            }
        }
        return totalAmount
    }

    const fetchProducts = async () =>{
        setLoading(true)
        try{
            const response = await axios.get(backendURL + '/api/product/list')
            if(response.data.success){
                setProducts(response.data.products)
            }else{
                toast.error(response.data.message)
            }
        }catch(e){
            toast.error(e.message)
            console.log(e.message)
        }finally{
            setLoading(false)
        }
    } 

    const getUserCart = async  (token) =>{
        try {
            const response = await axios.post(backendURL + "/api/cart/get" , {} ,{headers:{token}})
            if(response.data.success){
                setCartItems(response.data.cartData)
            }else{
                toast.error(response.data.message)
            }
        } catch (error) {
            console.log(error.message)
        }
    }

   

    useEffect(() => {
        if (retryCount < 3) {
          fetchProducts();
          if (products.length === 0) {
            setRetryCount((prev) => prev + 1);
          }
        }
        console.log("retry")
    }, [retryCount]);
    
    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() =>{
        if(!token || localStorage.getItem('token')){
            setToken(localStorage.getItem("token"))
            getUserCart(localStorage.getItem('token'))
        }
    },[])

    const value ={
        products , currency , loading,
        deliveryFee , search ,
        setSearch , showSearch , 
        setShowSearch , cartItems , 
        addToCart , getCartCount , 
        updateQuantity , getCartAmount,setCartItems,
        navigate , backendURL,token , setToken
    }

    return (
        <ShopContext.Provider value={value}>
            {children}
        </ShopContext.Provider>
    )
}

export default ShopContextProvider
