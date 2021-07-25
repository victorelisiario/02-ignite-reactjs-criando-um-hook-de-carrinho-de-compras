import { error } from 'console';
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
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart !== null) {
      return JSON.parse(storagedCart);
    }

    return [];
  });


  const addProduct = async (productId: number) => {
    try {

      const product = await api.get(`products/${productId}`)
      const selectedProduct = cart.filter((data) => data.id === product.data.id);

      if (selectedProduct.length === 0) {
        product.data.amount = 1;
        const newCart = [...cart, product.data,]
        setCart(newCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
        return
      } else {
        const newCart = [...cart];

        for (let i = 0; i < newCart.length; i++) {
          if (newCart[i].id === productId) {
            newCart[i].amount += 1;

            const stock = await api.get(`stock/${productId}`)

            if (newCart[i].amount > stock.data.amount) {
              newCart[i].amount -= 1;

              toast.error('Quantidade solicitada fora de estoque');
              return;
            }

            setCart(newCart);
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
            return
          }
        }
      }


      throw Error();
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {

      const updatedCart = [...cart];
      const productIndex = updatedCart.findIndex(product => product.id === productId);


      if (productIndex >= 0) {
        const newCart = cart.filter((data) => data.id !== productId);
        setCart([...newCart]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...newCart]))
      } else {
        throw Error();
      }


    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const checkCart = [...cart];
      const productIndex = checkCart.findIndex(product => product.id === productId);

      if (amount < 1) { return }
      if (productIndex >= 0) {
        const stock = await api.get(`stock/${productId}`)
        if (amount > stock.data.amount) {
          throw Error();
        }

        const newCart = [...cart];
        for (let i = 0; i < newCart.length; i++) {
          if (newCart[i].id === productId) {
            newCart[i].amount = amount;
            setCart(newCart);
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
            return
          }
        }
      } else {


        toast.error('Erro na alteração de quantidade do produto');
      }


    } catch {
      toast.error('Quantidade solicitada fora de estoque');
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
