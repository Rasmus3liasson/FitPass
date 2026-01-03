import colors from '@shared/constants/custom-colors';
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    getClubInvoices,
    getInvoiceDetails
} from "../../services/stripeEarningsService";

interface InvoiceViewerProps {
  clubId: string;
}

export const InvoiceViewer: React.FC<InvoiceViewerProps> = ({ clubId }) => {
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["club-invoices", clubId],
    queryFn: () => getClubInvoices(clubId, 12),
    enabled: !!clubId,
  });

  const {
    data: invoiceDetails,
    isLoading: isLoadingDetails,
    refetch: refetchDetails,
  } = useQuery({
    queryKey: ["invoice-details", clubId, selectedInvoice],
    queryFn: () => getInvoiceDetails(clubId, selectedInvoice!),
    enabled: false, // Manual trigger
  });

  const handleViewInvoice = async (invoiceId: string) => {
    setSelectedInvoice(invoiceId);
    setShowDetailsModal(true);
    await refetchDetails();
  };

  const formatAmount = (amount: number) => {
    return (amount / 100).toFixed(2).replace(".", ",");
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("sv-SE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      charge: "Betalning",
      refund: "Återbetalning",
      adjustment: "Justering",
      application_fee: "Applikationsavgift",
      application_fee_refund: "Avgiftsåterbetalning",
      transfer: "Överföring",
      payment: "Betalning",
      payout: "Utbetalning",
      validation: "Validering",
    };
    return types[type] || type;
  };

  if (isLoading) {
    return (
      <View className="px-6 mb-6">
        <View className="bg-surface rounded-2xl p-6 items-center justify-center">
          <ActivityIndicator size="small" color={colors.primary} />
          <Text className="text-textSecondary text-sm mt-2">
            Laddar fakturor...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="px-6 mb-6">
        <View className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
          <Text className="text-red-400 text-sm font-semibold mb-1">
            Kunde inte ladda fakturor
          </Text>
          <Text className="text-red-400/70 text-xs">
            {error instanceof Error ? error.message : "Ett fel uppstod"}
          </Text>
        </View>
      </View>
    );
  }

  if (!data?.hasStripeAccount) {
    return null;
  }

  return (
    <>
      <View className="px-6 mb-6">
        <Text className="text-textPrimary text-lg font-semibold mb-4">
          Transaktionshistorik
        </Text>

        {data.invoices.length === 0 ? (
          <View className="bg-surface rounded-2xl p-4">
            <Text className="text-textSecondary text-sm text-center">
              Inga transaktioner än
            </Text>
          </View>
        ) : (
          <View className="bg-surface rounded-2xl overflow-hidden">
            {data.invoices.map((invoice, index) => (
              <TouchableOpacity
                key={invoice.id}
                className={`p-4 flex-row items-center justify-between ${
                  index !== data.invoices.length - 1
                    ? "border-b border-accentGray/20"
                    : ""
                }`}
                onPress={() => handleViewInvoice(invoice.id)}
              >
                <View className="flex-1">
                  <Text className="text-textPrimary text-sm font-semibold mb-1">
                    {getTypeLabel(invoice.type)}
                  </Text>
                  <Text className="text-textSecondary text-xs">
                    {formatDate(invoice.created)}
                  </Text>
                  {invoice.description && (
                    <Text className="text-textSecondary text-xs mt-1">
                      {invoice.description}
                    </Text>
                  )}
                </View>
                <View className="items-end">
                  <Text
                    className={`text-base font-bold ${
                      invoice.amount >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {invoice.amount >= 0 ? "+" : ""}
                    {formatAmount(invoice.amount)} SEK
                  </Text>
                  <Text className="text-textSecondary text-xs mt-1">
                    Netto: {formatAmount(invoice.net)} SEK
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Invoice Details Modal */}
      <Modal
        visible={showDetailsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-3xl p-6 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-textPrimary text-xl font-bold">
                Transaktionsdetaljer
              </Text>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Text className="text-primary text-base font-semibold">
                  Stäng
                </Text>
              </TouchableOpacity>
            </View>

            {isLoadingDetails ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="small" color={colors.primary} />
                <Text className="text-textSecondary text-sm mt-2">
                  Laddar detaljer...
                </Text>
              </View>
            ) : invoiceDetails?.transaction ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="bg-surface rounded-2xl p-4 mb-4">
                  <View className="flex-row justify-between mb-3 pb-3 border-b border-accentGray/20">
                    <Text className="text-textSecondary text-sm">Typ</Text>
                    <Text className="text-textPrimary text-sm font-semibold">
                      {getTypeLabel(invoiceDetails.transaction.type)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between mb-3 pb-3 border-b border-accentGray/20">
                    <Text className="text-textSecondary text-sm">Belopp</Text>
                    <Text className="text-textPrimary text-sm font-semibold">
                      {formatAmount(invoiceDetails.transaction.amount)} SEK
                    </Text>
                  </View>
                  <View className="flex-row justify-between mb-3 pb-3 border-b border-accentGray/20">
                    <Text className="text-textSecondary text-sm">Avgift</Text>
                    <Text className="text-red-400 text-sm font-semibold">
                      -{formatAmount(invoiceDetails.transaction.fee)} SEK
                    </Text>
                  </View>
                  <View className="flex-row justify-between mb-3 pb-3 border-b border-accentGray/20">
                    <Text className="text-textSecondary text-sm">
                      Netto (efter avgifter)
                    </Text>
                    <Text className="text-green-400 text-base font-bold">
                      {formatAmount(invoiceDetails.transaction.net)} SEK
                    </Text>
                  </View>
                  <View className="flex-row justify-between mb-3 pb-3 border-b border-accentGray/20">
                    <Text className="text-textSecondary text-sm">Datum</Text>
                    <Text className="text-textPrimary text-sm font-semibold">
                      {formatDate(invoiceDetails.transaction.created)}
                    </Text>
                  </View>
                  {invoiceDetails.transaction.description && (
                    <View className="flex-row justify-between">
                      <Text className="text-textSecondary text-sm">
                        Beskrivning
                      </Text>
                      <Text className="text-textPrimary text-sm font-semibold flex-1 text-right ml-2">
                        {invoiceDetails.transaction.description}
                      </Text>
                    </View>
                  )}
                </View>

                <View className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <Text className="text-blue-400 text-xs">
                    ID: {invoiceDetails.transaction.id}
                  </Text>
                </View>
              </ScrollView>
            ) : (
              <Text className="text-textSecondary text-sm text-center py-8">
                Kunde inte ladda transaktionsdetaljer
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};
