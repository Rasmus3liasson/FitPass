import { Image, ScrollView } from "react-native";

interface Props {
  images: string[];
}

export function PosterCarousel({ images }: Props) {
  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      className="h-72"
    >
      {images.map((image, index) => (
        <Image
          key={index}
          source={{ uri: image }}
          className="w-[390px] h-72"
          resizeMode="cover"
        />
      ))}
    </ScrollView>
  );
}
