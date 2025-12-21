import { BillingHistory } from "../services/BillingService";
import {
    Calendar,
    CheckCircle2,
    ChevronDown,
    Download,
    Receipt,
    XCircle,
} from "lucide-react-native";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Linking,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface BillingHistoryCardProps {
  billingHistory: BillingHistory[];
}

export const BillingHistoryCard: React.FC<BillingHistoryCardProps> = ({
  billingHistory,
}) => {
  const [showAll, setShowAll] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const displayedInvoices = showAll
    ? billingHistory
    : billingHistory.slice(0, 3);

  const formatDate = (dateString: string) => {
    if (!dateString) return "Okänt datum";

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return "Okänt datum";
    }

    return date.toLocaleDateString("sv-SE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "paid":
        return {
          bg: "bg-green-500/10",
          text: "text-green-600",
          icon: CheckCircle2,
          label: "Betald",
          color: "#059669",
        };
      case "pending":
        return {
          bg: "bg-yellow-500/10",
          text: "text-yellow-600",
          icon: Calendar,
          label: "Väntar",
          color: "#d97706",
        };
      case "failed":
        return {
          bg: "bg-red-500/10",
          text: "text-red-600",
          icon: XCircle,
          label: "Misslyckad",
          color: "#dc2626",
        };
      default:
        return {
          bg: "bg-gray-500/10",
          text: "text-gray-600",
          icon: Receipt,
          label: status,
          color: "#6b7280",
        };
    }
  };

  const handleDownloadPDF = async (invoiceUrl: string, invoiceId: string) => {
    setDownloadingId(invoiceId);
    try {
      await Linking.openURL(`${invoiceUrl}/pdf`);
    } catch (error) {
      console.error("Error downloading PDF:", error);
    } finally {
      setTimeout(() => setDownloadingId(null), 1000);
    }
  };

  return (
    <View
      className="bg-surface rounded-3xl p-6 mb-6"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      <View className="flex-row items-center mb-6">
        <View className="w-12 h-12 rounded-2xl bg-primary/10 items-center justify-center mr-4">
          <Receipt size={24} color="#6366f1" strokeWidth={2.5} />
        </View>
        <View className="flex-1">
          <Text className="text-2xl font-bold text-textPrimary">
            Fakturahistorik
          </Text>
          {billingHistory.length > 0 && (
            <Text className="text-textSecondary text-sm mt-0.5">
              {billingHistory.length}{" "}
              {billingHistory.length === 1 ? "faktura" : "fakturor"}
            </Text>
          )}
        </View>
      </View>

      {billingHistory.length > 0 ? (
        <>
          <View className="space-y-3">
            {displayedInvoices.map((invoice) => {
              const statusConfig = getStatusConfig(invoice.status);
              const StatusIcon = statusConfig.icon;

              return (
                <View
                  key={invoice.id}
                  className="bg-background/50 rounded-2xl p-4 border border-surface/50"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1 mr-3">
                      <Text className="text-textPrimary font-bold text-base mb-2">
                        {invoice.description || "Månadsavgift"}
                      </Text>
                      <View className="flex-row items-center mb-2">
                        <Text className="text-textSecondary text-sm ml-1.5">
                          {formatDate(invoice.date)}
                        </Text>
                      </View>
                    </View>

                    <View className="items-end">
                      <Text className="text-textPrimary font-bold text-xl mb-1">
                        {formatAmount(invoice.amount)}
                      </Text>

                      <View
                        className={`${statusConfig.bg} px-3 py-1.5 rounded-xl flex-row items-center justify-center mt-1`}
                      >
                        <StatusIcon
                          size={14}
                          color={statusConfig.color}
                          strokeWidth={2.5}
                        />
                        <Text
                          className={`${statusConfig.text} text-xs font-bold ml-1.5`}
                        >
                          {statusConfig.label}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {invoice.invoice_url && (
                    <TouchableOpacity
                      onPress={() =>
                        handleDownloadPDF(invoice.invoice_url!, invoice.id)
                      }
                      disabled={downloadingId === invoice.id}
                      className="bg-primary/10 rounded-xl py-3 flex-row items-center justify-center mt-2"
                      activeOpacity={0.7}
                      style={{
                        shadowColor: "#6366f1",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 1,
                      }}
                    >
                      {downloadingId === invoice.id ? (
                        <>
                          <ActivityIndicator size="small" color="#6366f1" />
                          <Text className="text-primary font-bold ml-2 text-sm">
                            Öppnar PDF...
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text className="text-primary font-bold ml-2 text-sm">
                            Visa & Ladda ner PDF
                          </Text>
                          <Download
                            size={16}
                            color="#6366f1"
                            strokeWidth={2.5}
                            style={{ marginLeft: 6 }}
                          />
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>

          {billingHistory.length > 3 && (
            <TouchableOpacity
              onPress={() => setShowAll(!showAll)}
              className="mt-4 bg-primary/5 rounded-2xl py-3.5 flex-row items-center justify-center"
              activeOpacity={0.7}
            >
              <Text className="text-primary font-bold text-sm mr-2">
                {showAll
                  ? "Visa färre"
                  : `Visa alla (${billingHistory.length - 3} till)`}
              </Text>
              <ChevronDown
                size={18}
                color="#6366f1"
                strokeWidth={2.5}
                style={{
                  transform: [{ rotate: showAll ? "180deg" : "0deg" }],
                }}
              />
            </TouchableOpacity>
          )}
        </>
      ) : (
        <View className="items-center py-12">
          <View className="w-20 h-20 rounded-3xl bg-primary/10 items-center justify-center mb-5"></View>
          <Text className="text-textPrimary font-bold text-xl mb-2">
            Ingen fakturahistorik
          </Text>
          <Text className="text-textSecondary text-center text-sm px-4 leading-relaxed">
            Dina fakturor kommer att visas här när du gör betalningar
          </Text>
        </View>
      )}
    </View>
  );
};
