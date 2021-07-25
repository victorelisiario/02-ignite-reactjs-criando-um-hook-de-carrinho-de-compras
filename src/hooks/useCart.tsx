import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { isNewExpression } from 'typescript';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [stock, setStock] = useState<Stock[]>([]);
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart !== null) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  useEffect(() => {
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
  }, [cart]);

  useEffect(() => {
    api.get('stock')
      .then(response => {
        setStock(response.data)
      })
  }, [])

  const addProduct = async (productId: number) => {
    try {

      api.get(`products/${productId}`)
        .then(response => {
          const product: Product = response.data;
          const selectedProduct = cart.filter((data) => data.id == product.id);

          if (selectedProduct.length == 0) {
            product.amount = 1;
            setCart([...cart, product,])
            return
          }

          updateProductAmount({ productId: productId, amount: 1 })
        });
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter((data) => data.id != productId);

      setCart([...newCart]);
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      const newCart = [...cart];
      for (let i = 0; i < newCart.length; i++) {
        if (newCart[i].id == productId) {
          newCart[i].amount += amount;

          const productStockAmount = stock.filter((data) => data.id == productId);

          if (newCart[i].amount > productStockAmount[0].amount) {
            newCart[i].amount -= amount;
            throw new Error();
          } else {
            setCart(newCart);
            return
          }
        }
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
