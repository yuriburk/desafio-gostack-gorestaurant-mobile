import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
  Overlay,
  OverlayText,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  thumbnail_url: string;
  formattedPrice: string;
  extras: Extra[];
  category: number;
}

interface Favorite {
  id?: number;
  name: string;
  description: string;
  price: number;
  category: number;
  image_url: string;
  thumbnail_url: string;
}

interface Order {
  product_id: number;
  name: string;
  description: string;
  price: number;
  category: number;
  thumbnail_url: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [favorite, setFavorite] = useState({} as Favorite);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);
  const [confirmed, setConfirmed] = useState(false);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadApi(): Promise<void> {
      const { data: foodData } = await api.get<Food>(`foods/${routeParams.id}`);

      if (foodData) {
        foodData.formattedPrice = formatValue(foodData.price);
        setFood(foodData);
        setExtras(foodData.extras.map(extra => ({ ...extra, quantity: 0 })));

        const { data: favoriteData } = await api.get<Favorite[]>(
          `favorites?name_like=${foodData.name}`,
        );

        if (favoriteData.length > 0) {
          setIsFavorite(true);
          setFavorite(favoriteData[0]);
        }
      }
    }

    loadApi();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    const extraIndex = extras.findIndex(extra => extra.id === id);

    const updatedExtras = [...extras];
    updatedExtras[extraIndex].quantity += 1;
    setExtras(updatedExtras);
  }

  function handleDecrementExtra(id: number): void {
    const extraIndex = extras.findIndex(extra => extra.id === id);

    const updatedExtras = [...extras];

    if (updatedExtras[extraIndex].quantity > 0) {
      updatedExtras[extraIndex].quantity -= 1;
      setExtras(updatedExtras);
    }
  }

  function handleIncrementFood(): void {
    setFoodQuantity(state => state + 1);
  }

  function handleDecrementFood(): void {
    if (foodQuantity > 1) {
      setFoodQuantity(state => state - 1);
    }
  }

  const toggleFavorite = useCallback(async () => {
    if (!isFavorite) {
      const { data } = await api.post('favorites', {
        name: food.name,
        description: food.description,
        price: food.price,
        category: food.category,
        image_url: food.image_url,
        thumbnail_url: food.thumbnail_url,
      } as Favorite);
      setFavorite(data);
    } else {
      setFavorite({} as Favorite);
      await api.delete(`favorites/${favorite.id}`);
    }

    setIsFavorite(!isFavorite);
  }, [setIsFavorite, food, isFavorite, favorite.id]);

  const cartTotal = useMemo(() => {
    const extrasTotal = extras.reduce(
      (accumulator, { quantity, value }) => accumulator + quantity * value,
      0,
    );

    return extrasTotal + food.price * foodQuantity;
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    const order: Order = {
      product_id: food.id,
      name: food.name,
      description: food.description,
      price: cartTotal,
      category: food.category,
      thumbnail_url: food.image_url,
      extras: extras.filter(e => e.quantity > 0),
    };

    await api.post('orders', order);
    setConfirmed(true);
    setTimeout(() => navigation.goBack(), 2000);
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">
              {formatValue(cartTotal)}
            </TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>

      {confirmed && (
        <Overlay>
          <Icon name="thumbs-up" size={50} color="#39b100" />
          <OverlayText>Pedido confirmado!</OverlayText>
        </Overlay>
      )}
    </Container>
  );
};

export default FoodDetails;
