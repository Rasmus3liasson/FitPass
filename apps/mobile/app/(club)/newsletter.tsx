import { Button } from "@shared/components/Button";
import ImagePicker from "@shared/components/ImagePicker";
import { PageHeader } from "@shared/components/PageHeader";
import { SafeAreaWrapper } from "@shared/components/SafeAreaWrapper";
import { Section } from "@shared/components/Section";
import { useAuth } from "@shared/hooks/useAuth";
import { useClubByUserId } from "@shared/hooks/useClubs";
import { useFeedback } from "@shared/hooks/useFeedback";
import {
  useCreateNews,
  useDeleteNews,
  useNewsForClub,
  useUpdateNews,
} from "@shared/hooks/useNews";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Calendar,
  Edit3,
  Image as ImageIcon,
  Newspaper,
  Send,
  Target,
  Type,
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { NewsletterFeed } from "../social/NewsletterFeed";

const NewsTypeOptions = [
  {
    key: "announcement",
    label: "Meddelande",
    icon: "📢",
    color: "bg-blue-500/20 text-blue-400",
  },
  {
    key: "new_class",
    label: "Nytt Pass",
    icon: "🆕",
    color: "bg-green-500/20 text-green-400",
  },
  {
    key: "event",
    label: "Event",
    icon: "🎉",
    color: "bg-purple-500/20 text-purple-400",
  },
  {
    key: "promotion",
    label: "Erbjudande",
    icon: "🎁",
    color: "bg-yellow-500/20 text-yellow-400",
  },
  {
    key: "update",
    label: "Uppdatering",
    icon: "📝",
    color: "bg-accentGray/20 text-textSecondary",
  },
  {
    key: "other",
    label: "Annat",
    icon: "🔧",
    color: "bg-gray-500/20 text-gray-400",
  },
] as const;

type NewsType = (typeof NewsTypeOptions)[number]["key"] | string;

const TargetAudienceOptions = [
  { key: "all", label: "Alla", description: `Alla användare` },
  {
    key: "members",
    label: "Endast Medlemmar",
    description: `${process.env.EXPO_PUBLIC_APP_NAME} medlemmar`,
  },
  {
    key: "club_members",
    label: "Klubbmedlemmar",
    description: "Endast dina klubbmedlemmar",
  },
] as const;

type TargetAudience = (typeof TargetAudienceOptions)[number]["key"];

// Only include implemented action types
const ActionTypeOptions = [
  {
    key: "none",
    label: "Ingen åtgärd",
    description: "Endast visa information",
  },
  {
    key: "book_class",
    label: "Boka Pass",
    description: "Länka till passbokning",
  },
  { key: "visit_club", label: "Besök Klubb", description: "Visa klubbsida" },
  {
    key: "external_link",
    label: "Extern Länk",
    description: "Öppna extern webbsida",
  },
  { key: "promo_code", label: "Rabattkod", description: "Visa rabattkod" },
  {
    key: "contact_club",
    label: "Kontakta Klubb",
    description: "Visa kontaktinformation",
  },
] as const;

type ActionType = (typeof ActionTypeOptions)[number]["key"];

export default function NewsletterScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { showSuccess, showError } = useFeedback();
  const { data: club, isLoading: clubLoading } = useClubByUserId(
    user?.id || ""
  );
  const {
    data: existingNews,
    isLoading: newsLoading,
    refetch: refetchNews,
  } = useNewsForClub(club?.id || "", 10);
  const createNewsMutation = useCreateNews();
  const deleteNewsMutation = useDeleteNews();
  const updateNewsMutation = useUpdateNews();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<NewsType>("announcement");
  const [customType, setCustomType] = useState("");
  const [targetAudience, setTargetAudience] = useState<TargetAudience>("all");
  const [actionType, setActionType] = useState<ActionType>("none");
  const [actionText, setActionText] = useState("");
  const [actionValue, setActionValue] = useState(""); // For URLs, promo codes, etc.
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [priority, setPriority] = useState(5);
  const [expiresAt, setExpiresAt] = useState("");
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);

  const handleCreateNews = async () => {
    if (!user?.id) {
      showError("Fel", "Du måste vara inloggad för att skapa nyheter");
      return;
    }

    if (!club?.id) {
      showError("Fel", "Klubbinformation saknas");
      return;
    }

    if (!title.trim() || !description.trim()) {
      showError("Fel", "Vänligen fyll i alla obligatoriska fält");
      return;
    }

    if (type === "other" && !customType.trim()) {
      showError(
        "Fel",
        'Vänligen ange en anpassad kategori när "Annat" är valt'
      );
      return;
    }

    if (images.length === 0 && !editingNewsId) {
      showError("Fel", "Vänligen välj en bild för din artikel");
      return;
    }

    // Generate action data based on selected action type
    let actionData: Record<string, any> = {};
    let finalActionText = actionText;

    switch (actionType) {
      case "book_class":
        actionData = {
          type: "book_class",
          club_id: club.id,
          class_id: actionValue || null,
        };
        finalActionText = finalActionText || "Boka Pass";
        break;
      case "visit_club":
        actionData = {
          type: "visit_club",
          club_id: club.id,
        };
        finalActionText = finalActionText || "Besök Klubb";
        break;
      case "external_link":
        actionData = {
          type: "external_link",
          url: actionValue,
          club_id: club.id,
        };
        finalActionText = finalActionText || "Läs Mer";
        break;
      case "promo_code":
        actionData = {
          type: "promo_code",
          promo_code: actionValue,
          club_id: club.id,
        };
        finalActionText = finalActionText || "Använd Kod";
        break;
      case "contact_club":
        actionData = {
          type: "contact_club",
          club_id: club.id,
          phone: contactPhone || undefined,
          email: contactEmail || undefined,
        };
        finalActionText = finalActionText || "Kontakta Oss";
        break;
      default:
        actionData = {};
        finalActionText = "";
    }

    try {
      // Determine final type - use custom type if "other" is selected
      const finalType = type === "other" ? customType : type;

      if (editingNewsId) {
        // Update existing news
        const updateData = {
          title: title.trim(),
          description: description.trim(),
          content: content.trim(),
          type: finalType as any, // Allow custom types
          target_audience: targetAudience,
          priority: priority,
          expires_at: expiresAt || undefined,
          image_url: images[0] || undefined,
          action_text: finalActionText || undefined,
          action_data:
            Object.keys(actionData).length > 0 ? actionData : undefined,
        };

        await updateNewsMutation.mutateAsync({
          newsId: editingNewsId,
          updates: updateData,
        });
        showSuccess("Framgång", "Artikel uppdaterad framgångsrikt!");
      } else {
        // Create new news
        await createNewsMutation.mutateAsync({
          title: title.trim(),
          description: description.trim(),
          content: content.trim(),
          type: finalType as any, // Allow custom types
          club_id: club.id,
          author_id: user.id,
          status: "published" as const,
          target_audience: targetAudience,
          priority: priority,
          expires_at: expiresAt || undefined,
          image_url: images[0],
          action_text: finalActionText || undefined,
          action_data:
            Object.keys(actionData).length > 0 ? actionData : undefined,
        });
        showSuccess("Framgång", "Nyhetsartikel skapad framgångsrikt!");
      }

      // Reset form
      setTitle("");
      setDescription("");
      setContent("");
      setType("announcement");
      setCustomType("");
      setTargetAudience("all");
      setActionType("none");
      setActionText("");
      setActionValue("");
      setContactPhone("");
      setContactEmail("");
      setImages([]);
      setPriority(5);
      setExpiresAt("");
      setEditingNewsId(null);

      // Refetch the news list
      refetchNews();
    } catch (error) {
      console.error("Error saving news:", error);
      showError(
        "Fel",
        editingNewsId
          ? "Misslyckades med att uppdatera artikel. Försök igen."
          : "Misslyckades med att skapa nyhetsartikel. Försök igen."
      );
    }
  };

  const handleDeleteNews = async (newsId: string, title: string) => {
    showError(
      "Ta bort artikel",
      `Är du säker på att du vill ta bort "${title}"? Detta går inte att ångra.`,
      {
        buttonText: "Ta bort",
        onButtonPress: async () => {
          try {
            await deleteNewsMutation.mutateAsync(newsId);
            showSuccess("Framgång", "Artikeln har tagits bort");
            refetchNews();
          } catch (error) {
            console.error("Error deleting news:", error);
            showError(
              "Fel",
              "Misslyckades med att ta bort artikeln. Försök igen."
            );
          }
        },
      }
    );
  };

  const handleEditNews = (newsItem: any) => {
    // Set editing mode
    setEditingNewsId(newsItem.id);

    // Fill the form with existing news data
    setTitle(newsItem.title);
    setDescription(newsItem.description || "");
    setContent(newsItem.content || "");
    setType(newsItem.type);
    setTargetAudience(newsItem.target_audience || "all");

    // Handle action data
    if (newsItem.action_data) {
      const actionData = newsItem.action_data;
      setActionType(actionData.type || "none");
      setActionText(newsItem.action_text || "");

      switch (actionData.type) {
        case "external_link":
          setActionValue(actionData.url || "");
          break;
        case "promo_code":
          setActionValue(actionData.promo_code || "");
          break;
        case "contact_club":
          setContactPhone(actionData.phone || "");
          setContactEmail(actionData.email || "");
          break;
        default:
          setActionValue("");
      }
    } else {
      setActionType("none");
      setActionText("");
      setActionValue("");
      setContactPhone("");
      setContactEmail("");
    }

    // Handle image
    if (newsItem.image_url) {
      setImages([newsItem.image_url]);
    } else {
      setImages([]);
    }

    // Handle advanced settings
    setPriority(newsItem.priority || 5);
    if (newsItem.expires_at) {
      const expiryDate = new Date(newsItem.expires_at);
      setExpiresAt(expiryDate.toISOString().split("T")[0]); // Format as YYYY-MM-DD
    } else {
      setExpiresAt("");
    }

    // Scroll to top to show the form
    showSuccess(
      "Redigera artikel",
      'Formuläret har fyllts i med artikelns information. Scrolla upp för att redigera och klicka på "Uppdatera Artikel" för att spara ändringarna.'
    );
  };

  if (clubLoading) {
    return (
      <SafeAreaWrapper>
        <View className="flex-1 items-center justify-center bg-background">
          <ActivityIndicator size="large" color="#6366F1" />
          <Text className="text-textPrimary mt-4 text-base">
            Laddar klubbinformation...
          </Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  if (!club) {
    return (
      <SafeAreaWrapper>
        <View className="flex-1 items-center justify-center bg-background p-6">
          <Newspaper size={48} color="#A0A0A0" />
          <Text className="text-textPrimary text-xl font-semibold mt-4 text-center">
            Ingen Klubb Hittad
          </Text>
          <Text className="text-textSecondary text-center mt-2">
            Du behöver skapa en klubb först för att hantera nyhetsbrev
          </Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <PageHeader
        title="Nyhetsbrev"
        subtitle={`Skapa och hantera nyhetsartiklar för ${club.name}`}
      />
      <ScrollView
        className="flex-1 bg-background"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 0 }}
      >
        {/* Create New Article Section */}
        <Section
          title={editingNewsId ? "Redigera Artikel" : "Skapa Ny Artikel"}
          description={
            editingNewsId
              ? "Uppdatera din artikel med nya ändringar"
              : "Dela uppdateringar med dina medlemmar"
          }
        >
          {/* Article Type Selection */}
          <View className="bg-surface rounded-2xl p-4 mb-4">
            <View className="flex-row items-center mb-4">
              <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
                <Type size={16} color="#6366F1" />
              </View>
              <Text className="text-textPrimary text-lg font-semibold">
                Artikeltyp
              </Text>
            </View>

            <View className="flex-row flex-wrap gap-2">
              {NewsTypeOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  onPress={() => setType(option.key)}
                  className={`px-4 py-3 rounded-xl border ${
                    type === option.key
                      ? "bg-primary/20 border-primary"
                      : "bg-background border-accentGray"
                  }`}
                >
                  <View className="flex-row items-center">
                    <Text className="text-base mr-2">{option.icon}</Text>
                    <Text
                      className={`font-medium ${
                        type === option.key
                          ? "text-primary"
                          : "text-textSecondary"
                      }`}
                    >
                      {option.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Type Input */}
            {type === "other" && (
              <View className="mt-4">
                <Text className="text-textPrimary mb-2 font-medium">
                  Anpassad typ
                </Text>
                <TextInput
                  className="bg-background rounded-xl px-4 py-3 text-textPrimary border border-accentGray"
                  placeholder="Skriv din egna kategori..."
                  placeholderTextColor="#9CA3AF"
                  value={customType}
                  onChangeText={setCustomType}
                  maxLength={30}
                />
              </View>
            )}
          </View>

          {/* Basic Information */}
          <View className="bg-surface rounded-2xl p-4 mb-4">
            <View className="flex-row items-center mb-4">
              <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
                <Edit3 size={16} color="#6366F1" />
              </View>
              <Text className="text-textPrimary text-lg font-semibold">
                Artikelinnehåll
              </Text>
            </View>

            {/* Title */}
            <View className="mb-4">
              <Text className="text-textPrimary mb-2 font-medium">Titel *</Text>
              <TextInput
                className="bg-background rounded-xl px-4 py-3 text-textPrimary border border-accentGray"
                placeholder="Skriv artikeltitel..."
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className="text-textPrimary mb-2 font-medium">
                Beskrivning *
              </Text>
              <TextInput
                className="bg-background rounded-xl px-4 py-3 text-textPrimary border border-accentGray"
                placeholder="Kort beskrivning (visas i flödet)..."
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={setDescription}
                maxLength={200}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Full Content */}
            <View className="mb-4">
              <Text className="text-textPrimary mb-2 font-medium">
                Fullständigt Innehåll
              </Text>
              <TextInput
                className="bg-background rounded-xl px-4 py-3 text-textPrimary border border-accentGray"
                placeholder="Fullständigt artikelinnehåll (valfritt)..."
                placeholderTextColor="#9CA3AF"
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Call to Action */}
          <View className="bg-surface rounded-2xl p-4 mb-4">
            <View className="flex-row items-center mb-4">
              <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
                <Send size={16} color="#6366F1" />
              </View>
              <Text className="text-textPrimary text-lg font-semibold">
                Handlingsknapp
              </Text>
            </View>

            {/* Action Type Selection */}
            <View className="mb-4">
              <Text className="text-textPrimary mb-2 font-medium">
                Åtgärdstyp
              </Text>
              {ActionTypeOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  onPress={() => setActionType(option.key)}
                  className={`flex-row items-center p-3 rounded-xl mb-2 border ${
                    actionType === option.key
                      ? "bg-primary/10 border-primary"
                      : "bg-background border-accentGray"
                  }`}
                >
                  <View
                    className={`w-4 h-4 rounded-full mr-3 ${
                      actionType === option.key ? "bg-primary" : "bg-accentGray"
                    }`}
                  />
                  <View className="flex-1">
                    <Text
                      className={`font-medium ${
                        actionType === option.key
                          ? "text-textPrimary"
                          : "text-textSecondary"
                      }`}
                    >
                      {option.label}
                    </Text>
                    <Text className="text-textSecondary text-sm">
                      {option.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Text */}
            {actionType !== "none" && (
              <View className="mb-4">
                <Text className="text-textPrimary mb-2 font-medium">
                  Knapptext
                </Text>
                <TextInput
                  className="bg-background rounded-xl px-4 py-3 text-textPrimary border border-accentGray"
                  placeholder="t.ex. 'Boka Nu', 'Läs Mer', 'Gå Med'..."
                  placeholderTextColor="#9CA3AF"
                  value={actionText}
                  onChangeText={setActionText}
                  maxLength={50}
                />
              </View>
            )}

            {/* Action Value (URL, Promo Code, etc.) */}
            {(actionType === "external_link" ||
              actionType === "promo_code") && (
              <View className="mb-4">
                <Text className="text-textPrimary mb-2 font-medium">
                  {actionType === "external_link"
                    ? "Webbadress (URL)"
                    : "Rabattkod"}
                </Text>
                <TextInput
                  className="bg-background rounded-xl px-4 py-3 text-textPrimary border border-accentGray"
                  placeholder={
                    actionType === "external_link"
                      ? "https://exempel.se"
                      : "RABATT20"
                  }
                  placeholderTextColor="#9CA3AF"
                  value={actionValue}
                  onChangeText={setActionValue}
                  autoCapitalize={
                    actionType === "promo_code" ? "characters" : "none"
                  }
                  keyboardType={
                    actionType === "external_link" ? "url" : "default"
                  }
                />
              </View>
            )}

            {/* Contact Information for contact_club action */}
            {actionType === "contact_club" && (
              <View className="space-y-4">
                <View>
                  <Text className="text-textPrimary mb-2 font-medium">
                    Telefonnummer (valfritt)
                  </Text>
                  <TextInput
                    className="bg-background rounded-xl px-4 py-3 text-textPrimary border border-accentGray"
                    placeholder="070-123 45 67"
                    placeholderTextColor="#9CA3AF"
                    value={contactPhone}
                    onChangeText={setContactPhone}
                    keyboardType="phone-pad"
                  />
                </View>

                <View className="mt-4">
                  <Text className="text-textPrimary mb-2 font-medium">
                    E-postadress (valfritt)
                  </Text>
                  <TextInput
                    className="bg-background rounded-xl px-4 py-3 text-textPrimary border border-accentGray"
                    placeholder="kontakt@dinklub.se"
                    placeholderTextColor="#9CA3AF"
                    value={contactEmail}
                    onChangeText={setContactEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View className="mt-2">
                  <Text className="text-textSecondary text-sm">
                    Om inget anges används klubbsidans kontaktinformation
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Target Audience */}
          <View className="bg-surface rounded-2xl p-4 mb-4">
            <View className="flex-row items-center mb-4">
              <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
                <Target size={16} color="#6366F1" />
              </View>
              <Text className="text-textPrimary text-lg font-semibold">
                Målgrupp
              </Text>
            </View>

            {TargetAudienceOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                onPress={() => setTargetAudience(option.key)}
                className={`flex-row items-center p-4 rounded-xl mb-2 border ${
                  targetAudience === option.key
                    ? "bg-primary/10 border-primary"
                    : "bg-background border-accentGray"
                }`}
              >
                <View
                  className={`w-4 h-4 rounded-full mr-3 ${
                    targetAudience === option.key
                      ? "bg-primary"
                      : "bg-accentGray"
                  }`}
                />
                <View className="flex-1">
                  <Text
                    className={`font-medium ${
                      targetAudience === option.key
                        ? "text-textPrimary"
                        : "text-textSecondary"
                    }`}
                  >
                    {option.label}
                  </Text>
                  <Text className="text-textSecondary text-sm">
                    {option.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Image Upload */}
          <View className="bg-surface rounded-2xl p-4 mb-4">
            <View className="flex-row items-center mb-4">
              <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
                <ImageIcon size={16} color="#6366F1" />
              </View>
              <Text className="text-textPrimary text-lg font-semibold">
                Artikelbild
              </Text>
            </View>

            <ImagePicker
              value={images}
              onChange={setImages}
              fullWidth
              bucket="images"
              folder="news"
              maxImages={1}
            />
          </View>

          {/* Advanced Settings */}
          <View className="bg-surface rounded-2xl p-4 mb-4">
            <View className="flex-row items-center mb-4">
              <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
                <Calendar size={16} color="#6366F1" />
              </View>
              <Text className="text-textPrimary text-lg font-semibold">
                Avancerade Inställningar
              </Text>
            </View>

            {/* Priority */}
            <View className="mb-4">
              <Text className="text-textPrimary mb-2 font-medium">
                Prioritet (1-10)
              </Text>
              <View className="flex-row items-center">
                <TextInput
                  className="bg-background rounded-xl px-4 py-3 text-textPrimary border border-accentGray flex-1"
                  placeholder="5"
                  placeholderTextColor="#9CA3AF"
                  value={priority.toString()}
                  onChangeText={(text) => {
                    const num = parseInt(text) || 1;
                    setPriority(Math.min(Math.max(num, 1), 10));
                  }}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text className="text-textSecondary text-sm ml-3">
                  Högre prioritet visas först
                </Text>
              </View>
            </View>

            {/* Expiration */}
            <View>
              <Text className="text-textPrimary mb-2 font-medium">
                Utgår Den (Valfritt)
              </Text>
              <TextInput
                className="bg-background rounded-xl px-4 py-3 text-textPrimary border border-accentGray"
                placeholder="ÅÅÅÅ-MM-DD (lämna tomt för ingen utgång)"
                placeholderTextColor="#9CA3AF"
                value={expiresAt}
                onChangeText={setExpiresAt}
              />
            </View>
          </View>

          {/* Publish Button */}
          <View className="px-4">
            {editingNewsId && (
              <Button
                title="Avbryt Redigering"
                onPress={() => {
                  setEditingNewsId(null);
                  setTitle("");
                  setDescription("");
                  setContent("");
                  setType("announcement");
                  setTargetAudience("all");
                  setActionType("none");
                  setActionText("");
                  setActionValue("");
                  setImages([]);
                  setPriority(5);
                  setExpiresAt("");
                }}
                style="bg-accentGray shadow-lg mb-3"
              />
            )}
            <Button
              title={
                createNewsMutation.isPending || updateNewsMutation.isPending
                  ? editingNewsId
                    ? "Uppdaterar..."
                    : "Publicerar..."
                  : editingNewsId
                  ? "Uppdatera Artikel"
                  : "Publicera Artikel"
              }
              onPress={handleCreateNews}
              disabled={
                createNewsMutation.isPending ||
                updateNewsMutation.isPending ||
                !title.trim() ||
                !description.trim()
              }
              icon={
                createNewsMutation.isPending ||
                updateNewsMutation.isPending ? undefined : (
                  <Send size={18} color="#FFFFFF" />
                )
              }
              style="bg-primary shadow-lg"
            />
          </View>
        </Section>

        {/* Recent Articles */}
        {existingNews && existingNews.length > 0 && (
          <Section
            title="Senaste Artiklar"
            description="Dina publicerade nyhetsartiklar"
          >
            <NewsletterFeed
              newsItems={existingNews.map((article) => ({
                id: article.id,
                title: article.title,
                description: article.description || "",
                gym_name: club?.name || "Min Klubb",
                gym_logo: club?.image_url,
                image_url: article.image_url,
                timestamp: article.published_at || article.created_at,
                type: article.type as any,
                action_text: article.action_text,
                action_data: article.action_data,
                views_count: article.views_count,
                published_at: article.published_at,
                created_at: article.created_at,
              }))}
              onNewsItemPress={() => {}} // No action needed for club mode
              isClubMode={true}
              onEditNews={handleEditNews}
              onDeleteNews={handleDeleteNews}
              isDeleting={deleteNewsMutation.isPending}
            />
          </Section>
        )}
      </ScrollView>
    </SafeAreaWrapper>
  );
}
