import {
  Calendar,
  CaretRight,
  CheckCircle,
  DownloadSimple,
  Receipt,
  XCircle,
} from 'phosphor-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Linking, Text, TouchableOpacity, View } from 'react-native';
import colors from '../../constants/custom-colors';
import { BillingHistory } from '../../services/BillingService';

interface BillingHistoryCardProps {
  billingHistory: BillingHistory[];
}

export const BillingHistoryCard: React.FC<BillingHistoryCardProps> = ({ billingHistory }) => {
  const [showAll, setShowAll] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const displayedInvoices = showAll ? billingHistory : billingHistory.slice(0, 3);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Okänt datum';

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return 'Okänt datum';
    }

    return date.toLocaleDateString('sv-SE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return {
          bg: 'bg-accentGreen/10',
          text: 'text-accentGreen',

          label: 'Betald',
          color: '#059669',
        };
      case 'pending':
        return {
          bg: 'bg-accentYellow/10',
          text: 'text-accentYellow-600',

          label: 'Väntar',
          color: '#d97706',
        };
      case 'failed':
        return {
          bg: 'bg-accentRed/10',
          text: 'text-accentRed',

          label: 'Misslyckad',
          color: '#dc2626',
        };
      default:
        return {
          bg: 'bg-accentGray/10',
          text: 'text-accentGray',

          label: status,
          color: colors.borderGray,
        };
    }
  };

  const handleDownloadPDF = async (invoiceUrl: string, invoiceId: string) => {
    setDownloadingId(invoiceId);
    try {
      await Linking.openURL(`${invoiceUrl}/pdf`);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    } finally {
      setTimeout(() => setDownloadingId(null), 1000);
    }
  };

  return (
    <View className="mb-6">
      <View className="flex-row items-center mb-4">
        <Text className="text-xl font-semibold text-textPrimary">Fakturahistorik</Text>
        {billingHistory.length > 0 && (
          <Text className="text-textSecondary text-sm ml-2">({billingHistory.length})</Text>
        )}
      </View>

      {billingHistory.length > 0 ? (
        <>
          <View className="gap-3">
            {displayedInvoices.map((invoice) => {
              const statusConfig = getStatusConfig(invoice.status);

              return (
                <View
                  key={invoice.id}
                  className="bg-surface rounded-xl p-4 border border-borderGray/10"
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1 mr-3">
                      <Text className="text-textPrimary font-semibold text-base mb-1">
                        {invoice.description || 'Månadsavgift'}
                      </Text>
                      <Text className="text-textSecondary text-xs">{formatDate(invoice.date)}</Text>
                    </View>

                    <View className="items-end">
                      <Text className="text-textPrimary font-bold text-lg mb-1.5">
                        {formatAmount(invoice.amount)}
                      </Text>

                      <View
                        className={`${statusConfig.bg} px-2.5 py-1 rounded-lg flex-row items-center gap-1`}
                      >
                        {}

                        <Text className={`${statusConfig.text} text-xs font-semibold`}>
                          {statusConfig.label}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {invoice.invoice_url && (
                    <TouchableOpacity
                      onPress={() => handleDownloadPDF(invoice.invoice_url!, invoice.id)}
                      disabled={downloadingId === invoice.id}
                      className="bg-primary/10 rounded-lg py-2.5 flex-row items-center justify-center mt-2 border border-primary/20"
                      activeOpacity={0.7}
                    >
                      {downloadingId === invoice.id ? (
                        <>
                          <ActivityIndicator size="small" color={colors.primary} />
                          <Text className="text-textPrimary font-semibold ml-2 text-xs">
                            Öppnar...
                          </Text>
                        </>
                      ) : (
                        <>
                          <DownloadSimple size={14} color={colors.primary} />
                          <Text className="text-textPrimary font-semibold ml-2 text-xs">
                            Ladda ner PDF
                          </Text>
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
              className="mt-3 bg-primary/5 rounded-lg py-2.5 flex-row items-center justify-center border border-primary/10"
              activeOpacity={0.7}
            >
              <Text className="text-textPrimary font-semibold text-xs">
                {showAll ? 'Visa färre' : `Visa ${billingHistory.length - 3} till`}
              </Text>
              <CaretRight
                size={14}
                color={colors.primary}
                style={{
                  marginLeft: 4,
                  transform: [{ rotate: showAll ? '270deg' : '90deg' }],
                }}
              />
            </TouchableOpacity>
          )}
        </>
      ) : (
        <View className="bg-surface rounded-xl p-6 items-center">
          <Receipt size={40} color={colors.textSecondary} />
          <Text className="text-textPrimary font-semibold text-base mb-1 mt-3">
            Ingen fakturahistorik
          </Text>
          <Text className="text-textSecondary text-center text-sm leading-relaxed">
            Dina fakturor visas här när du gör betalningar
          </Text>
        </View>
      )}
    </View>
  );
};
