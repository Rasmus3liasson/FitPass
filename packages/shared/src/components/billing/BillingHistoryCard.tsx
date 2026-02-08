import {
  Calendar,
  CaretRightIcon,
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

    let dateformat = date.toLocaleDateString('sv-SE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    // Remove dot from month abbreviation
    dateformat = dateformat.replace('.', '');
    if (isNaN(date.getTime())) return 'Okänt datum';
    return dateformat;
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
          icon: CheckCircle,
          color: '#059669',
        };
      case 'pending':
        return {
          bg: 'bg-accentYellow/10',
          text: 'text-accentYellow-600',
          label: 'Väntar',
          icon: Calendar,
          color: '#d97706',
        };
      case 'failed':
        return {
          bg: 'bg-accentRed/10',
          text: 'text-accentRed',
          label: 'Misslyckad',
          icon: XCircle,
          color: '#dc2626',
        };
      default:
        return {
          bg: 'bg-accentGray/10',
          text: 'text-accentGray',
          label: status,
          icon: Calendar,
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
      {/* Header */}
      <View className="flex-row items-center mb-4 justify-between">
        <Text className="text-xl font-bold text-textPrimary">Fakturahistorik</Text>
        {billingHistory.length > 0 && (
          <View className="bg-primary/20 px-3 py-1 rounded-full">
            <Text className="text-primary font-bold text-sm">{billingHistory.length}</Text>
          </View>
        )}
      </View>

      {billingHistory.length > 0 ? (
        <>
          <View className="gap-3">
            {displayedInvoices.map((invoice) => {
              const status = getStatusConfig(invoice.status);
              const StatusIcon = status.icon;

              return (
                <View
                  key={invoice.id}
                  className="bg-surface rounded-2xl p-4 flex-row justify-between items-center"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <View className="flex-1 mr-4">
                    <Text className="text-textPrimary font-semibold text-base mb-1">
                      {invoice.description || 'Månadsavgift'}
                    </Text>

                    <View className="flex-row items-center gap-1 mb-2">
                      <Text className="text-textSecondary text-xs">{formatDate(invoice.date)}</Text>
                    </View>

                    <View
                      className={`${status.bg} px-3 py-1 rounded-full flex-row items-center gap-2 justify-center min-w-20 max-w-24`}
                    >
                      <Text className={`${status.text} text-xs font-bold`}>{status.label}</Text>
                    </View>
                  </View>

                  <View className="items-end">
                    <Text className="text-textPrimary font-bold text-lg mb-2">
                      {formatAmount(invoice.amount)}
                    </Text>

                    {invoice.invoice_url && (
                      <TouchableOpacity
                        onPress={() => handleDownloadPDF(invoice.invoice_url!, invoice.id)}
                        disabled={downloadingId === invoice.id}
                        className="bg-primary/10 p-2.5 rounded-xl"
                        activeOpacity={0.7}
                      >
                        {downloadingId === invoice.id ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          <DownloadSimple size={20} color={colors.primary} weight="bold" />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {billingHistory.length > 3 && (
            <TouchableOpacity
              onPress={() => setShowAll(!showAll)}
              className="mt-4 flex-row items-center justify-center gap-2"
              activeOpacity={0.7}
            >
              <Text className="text-textPrimary font-semibold text-sm">
                {showAll ? 'Visa färre' : `Visa ${billingHistory.length - 3} till`}
              </Text>
              <CaretRightIcon
                size={16}
                color={colors.textPrimary}
                weight="bold"
                style={{ transform: [{ rotate: showAll ? '270deg' : '90deg' }] }}
              />
            </TouchableOpacity>
          )}
        </>
      ) : (
        <View className="bg-surface/50 rounded-2xl p-8 items-center border border-borderGray/10">
          <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
            <Receipt size={32} color={colors.primary} weight="bold" />
          </View>
          <Text className="text-textPrimary font-bold text-lg mb-2">Ingen fakturahistorik</Text>
          <Text className="text-textSecondary text-center text-sm leading-relaxed">
            Dina fakturor visas här när du gör betalningar
          </Text>
        </View>
      )}
    </View>
  );
};
