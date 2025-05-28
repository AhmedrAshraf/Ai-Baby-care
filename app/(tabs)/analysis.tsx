import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Moon, Sun, Zap, TrendingUp, ArrowLeft, Brain, Lightbulb, AlertCircle, Clock, Star, X, Calendar } from 'lucide-react-native';
import { router } from 'expo-router';
import { useSleepContext } from '@/contexts/SleepContext';
import { format, subDays, differenceInDays, differenceInMonths, differenceInYears, addDays } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { getBabyCareResponse } from '@/utils/gemini';

export default function AnalysisScreen() {
  const { sleepSessions } = useSleepContext();
  const { user } = useAuth();
  const [period, setPeriod] = useState<'week' | 'month' | '3months'>('week');
  const [stats, setStats] = useState({
    avgDailySleep: 0,
    avgWakeWindow: 0,
    sleepQuality: 0,
    avgNapsPerDay: 0
  });
  const [analysis, setAnalysis] = useState({
    sleepAnalysis: '',
    recommendation: '',
    loading: false
  });

  const calculateBabyAgeInDays = () => {
    if (!user?.user_metadata?.baby_birthday) return 0;
    const birthDate = new Date(user.user_metadata.baby_birthday);
    const today = new Date();
    return differenceInDays(today, birthDate);
  };

  const getAnalysisPeriodAvailability = () => {
    const ageInDays = calculateBabyAgeInDays();
    return {
      week: ageInDays >= 7,
      month: ageInDays >= 30,
      threeMonths: ageInDays >= 90,
      availableDate: {
        week: addDays(new Date(user?.user_metadata?.baby_birthday), 7),
        month: addDays(new Date(user?.user_metadata?.baby_birthday), 30),
        threeMonths: addDays(new Date(user?.user_metadata?.baby_birthday), 90)
      }
    } as const;
  };

  const handlePeriodChange = (newPeriod: 'week' | 'month' | '3months') => {
    const availability = getAnalysisPeriodAvailability();
    const periodKey = newPeriod === '3months' ? 'threeMonths' : newPeriod;
    
    // Always update the period first
    setPeriod(newPeriod);
    
    if (!availability[periodKey as keyof typeof availability]) {
      const availableDate = format(availability.availableDate[periodKey as keyof typeof availability.availableDate], 'MMM do, yyyy');
      setShowAlert({
        visible: true,
        message: `${newPeriod === '3months' ? '3-month' : newPeriod} analysis will be available from ${availableDate}`,
        type: 'info'
      });
      return;
    }
    
    setShowAlert(prev => ({ ...prev, visible: false }));
  };

  const [showAlert, setShowAlert] = useState<{
    visible: boolean;
    message: string;
    type: 'info' | 'warning' | 'error';
  }>({
    visible: false,
    message: '',
    type: 'info'
  });

  // this useffect is for debugging purposese
  useEffect(() => {
    console.log('--- Data Verification ---');
    console.log('User Data:', {
      isAuthenticated: !!user,
      hasMetadata: !!user?.user_metadata,
      babyBirthday: user?.user_metadata?.baby_birthday,
      babyName: user?.user_metadata?.baby_name});
    // this is for debugging purposes
    console.log('Sleep Sessions:', {  totalSessions: sleepSessions.length,  sessions: sleepSessions});
    // this is for calculating the stats
    calculateStats();
    // this is for calculationg the babay age;
    calculateAndLogBabyAge();
  }, [sleepSessions, period]);

  useEffect(() => {
    generateSleepAnalysis();
  }, [stats]);

  const generateSleepAnalysis = async () => {
    try {
      const babyAge = calculateBabyAgeInMonths();
      const query = `As a baby sleep expert, analyze this sleep data for a ${babyAge} month old baby:
      - Average daily sleep: ${formatHours(stats.avgDailySleep)}
      - Average wake window: ${formatHours(stats.avgWakeWindow)}
      - Sleep quality score: ${Math.round(stats.sleepQuality)}%
      - Average naps per day: ${stats.avgNapsPerDay.toFixed(1)}
      
      Provide a brief analysis and one specific recommendation.`;

      setAnalysis(prev => ({ ...prev, loading: true }));
      const { response } = await getBabyCareResponse(query);
      const analysisText = response.split('Recommendation:');
      
      setAnalysis({
        sleepAnalysis: analysisText[0].trim(),
        recommendation: analysisText[1] ? analysisText[1].trim() : 'Based on your baby\'s sleep patterns, maintain consistency in the current schedule.',
        loading: false
      });
    } catch (error) {
      console.error('Error generating sleep analysis:', error);
      setAnalysis({
        sleepAnalysis: "Your baby's sleep patterns are being tracked. Continue monitoring for personalized insights.",
        recommendation: "Maintain a consistent sleep schedule and environment for optimal rest.",
        loading: false
      });
    }
  };

  const calculateBabyAgeInMonths = () => {
    if (!user?.user_metadata?.baby_birthday) return 0;
    const birthDate = new Date(user.user_metadata.baby_birthday);
    const today = new Date();
    return differenceInMonths(today, birthDate);
  };

  const calculateAndLogBabyAge = () => {
    if (!user?.user_metadata?.baby_birthday) {
      console.log('Baby birthday not found in user profile');
      return;
    }

    const birthDate = new Date(user.user_metadata.baby_birthday);
    const today = new Date();

    const years = differenceInYears(today, birthDate);
    const months = differenceInMonths(today, birthDate) % 12;
    const days = differenceInDays(today, birthDate) % 30;

    console.log('Baby Age Calculation:');
    console.log('Birth Date:', format(birthDate, 'yyyy-MM-dd'));
    console.log('Current Date:', format(today, 'yyyy-MM-dd'));
    console.log(`Age: ${years ? years + ' years' : ''} ${months ? months + ' months' : ''} ${days} days`);
    console.log('Total days:', differenceInDays(today, birthDate));
  };

  const calculateStats = () => {
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate = subDays(now, 7);
        break;
      case 'month':
        startDate = subDays(now, 30);
        break;
      case '3months':
        startDate = subDays(now, 90);
        break;
    }

    console.log('Sleep Stats Calculation:');
    console.log('Period:', period);
    console.log('Date Range:', format(startDate, 'yyyy-MM-dd'), 'to', format(now, 'yyyy-MM-dd'));

    const relevantSessions = sleepSessions.filter(session => {
      const sessionStartTime = new Date(session.startTime);
      return sessionStartTime >= startDate && sessionStartTime <= now;
    });

    console.log('Relevant Sessions:', {
      total: relevantSessions.length,
      filtered: relevantSessions
    });

    if (relevantSessions.length === 0) {
      console.log('No sleep sessions found for the selected period');
      setStats({
        avgDailySleep: 0,
        avgWakeWindow: 0,
        sleepQuality: 0,
        avgNapsPerDay: 0
      });
      return;
    }

    // Calculate average daily sleep
    const totalSleepMinutes = relevantSessions.reduce((acc, session) => 
      acc + (session.duration || 0), 0);
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const avgDailySleep = totalSleepMinutes / days;

    // Calculate average wake window
    const napSessions = relevantSessions.filter(session => session.type === 'nap');
    let totalWakeMinutes = 0;
    let wakeWindowCount = 0;

    for (let i = 0; i < napSessions.length - 1; i++) {
      const currentSession = napSessions[i];
      const nextSession = napSessions[i + 1];
      
      if (currentSession.endTime && nextSession.startTime) {
        const endTime = new Date(currentSession.endTime);
        const nextStartTime = new Date(nextSession.startTime);
        const wakeWindow = (nextStartTime.getTime() - endTime.getTime()) / (1000 * 60);
        if (wakeWindow > 0) {
          totalWakeMinutes += wakeWindow;
          wakeWindowCount++;
        }
      }
    }
    const avgWakeWindow = wakeWindowCount > 0 ? totalWakeMinutes / wakeWindowCount : 0;

    // Calculate sleep quality (based on recommended sleep duration for infants)
    const recommendedSleep = 840; // 14 hours in minutes
    const sleepQuality = Math.min((avgDailySleep / recommendedSleep) * 100, 100);

    // Calculate average naps per day
    const avgNapsPerDay = napSessions.length / days;

    console.log('Calculated Stats:', {
      totalSleepMinutes,
      avgDailySleep,
      totalWakeMinutes,
      wakeWindowCount,
      avgWakeWindow,
      sleepQuality,
      avgNapsPerDay
    });

    setStats({
      avgDailySleep: avgDailySleep,
      avgWakeWindow: avgWakeWindow,
      sleepQuality: sleepQuality,
      avgNapsPerDay: avgNapsPerDay
    });
  };

  const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}.${mins.toString().padStart(2, '0')}h`;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#7C3AED', '#6D28D9']}
        style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sleep Analysis</Text>
        </View>
        <View style={styles.periodSelector}>
          <TouchableOpacity 
            style={[styles.periodButton, period === 'week' && styles.periodButtonActive]}
            onPress={() => handlePeriodChange('week')}>
            <Text style={[styles.periodText, period === 'week' && styles.periodTextActive]}>Week</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.periodButton, period === 'month' && styles.periodButtonActive]}
            onPress={() => handlePeriodChange('month')}>
            <Text style={[styles.periodText, period === 'month' && styles.periodTextActive]}>Month</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.periodButton, period === '3months' && styles.periodButtonActive]}
            onPress={() => handlePeriodChange('3months')}>
            <Text style={[styles.periodText, period === '3months' && styles.periodTextActive]}>3 Months</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {showAlert.visible ? (
        <View style={styles.centeredContainer}>
          <View style={styles.noDataContent}>
            <View style={styles.noDataIconContainer}>
              <Calendar size={48} color="#7C3AED" />
            </View>
            <Text style={styles.noDataTitle}>Analysis Coming Soon!</Text>
            <Text style={styles.noDataMessage}>
              {showAlert.message}
            </Text>
            {/* <TouchableOpacity
              style={styles.switchButton}
              onPress={() => handlePeriodChange('week')}>
              <Text style={styles.switchButtonText}>Switch to Weekly Analysis</Text>
            </TouchableOpacity> */}
          </View>
        </View>
      ) : !getAnalysisPeriodAvailability()[period === '3months' ? 'threeMonths' : period] ? (
        <View style={styles.centeredContainer}>
          <View style={styles.noDataContent}>
            <View style={styles.noDataIconContainer}>
              <Calendar size={48} color="#7C3AED" />
            </View>
            <Text style={styles.noDataTitle}>Analysis Coming Soon!</Text>
            <Text style={styles.noDataMessage}>
              {`${period === '3months' ? '3-month' : period} analysis will be available from ${
                format(
                  getAnalysisPeriodAvailability().availableDate[period === '3months' ? 'threeMonths' : period],
                  'MMM do, yyyy'
                )
              }`}
            </Text>
            {/* <TouchableOpacity
              style={styles.switchButton}
              onPress={() => handlePeriodChange('week')}>
              <Text style={styles.switchButtonText}>Switch to Weekly Analysis</Text>
            </TouchableOpacity> */}
          </View>
        </View>
      ) : (
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}>
          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sleep Overview</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Moon size={24} color="#8B5CF6" />
                  <Text style={styles.statNumber}>{formatHours(stats.avgDailySleep)}</Text>
                  <Text style={styles.statLabel}>Avg. Daily Sleep</Text>
                </View>
                <View style={styles.statCard}>
                  <Sun size={24} color="#FCD34D" />
                  <Text style={styles.statNumber}>{formatHours(stats.avgWakeWindow)}</Text>
                  <Text style={styles.statLabel}>Avg. Wake Window</Text>
                </View>
                <View style={styles.statCard}>
                  <Zap size={24} color="#10B981" />
                  <Text style={styles.statNumber}>{Math.round(stats.sleepQuality)}%</Text>
                  <Text style={styles.statLabel}>Sleep Quality</Text>
                </View>
                <View style={styles.statCard}>
                  <TrendingUp size={24} color="#EC4899" />
                  <Text style={styles.statNumber}>{stats.avgNapsPerDay.toFixed(1)}</Text>
                  <Text style={styles.statLabel}>Naps per Day</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sleep Patterns</Text>
              <View style={styles.patternCard}>
                <View style={styles.patternHeader}>
                  <View style={styles.patternHeaderLeft}>
                    <Brain size={24} color="#7C3AED" />
                    <Text style={styles.patternTitle}> Sleep Analysis</Text>
                  </View>
                  {analysis.loading && (
                    <View style={styles.analysisLoadingContainer}>
                      <ActivityIndicator size="small" color="#7C3AED" />
                      <Text style={styles.analysisLoadingText}>Analyzing...</Text>
                    </View>
                  )}
                </View>

                <View style={styles.analysisContent}>
                  <View style={styles.analysisSection}>
                    <Text style={styles.analysisSectionTitle}>Sleep Pattern Analysis</Text>
                    <Text style={styles.patternDescription}>
                      {analysis.sleepAnalysis || "Tracking your baby's sleep patterns..."}
                    </Text>
                  </View>

                  <View style={styles.recommendationContainer}>
                    <View style={styles.recommendationHeader}>
                      <Lightbulb size={20} color="#7C3AED" />
                      <Text style={styles.recommendationHeaderText}>Expert Recommendations</Text>
                    </View>
                    <View style={styles.recommendationContent}>
                      <Text style={styles.recommendationText}>
                        {analysis.recommendation || "Analyzing sleep data to provide personalized recommendations..."}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.sleepTipsContainer}>
                    <View style={styles.sleepTipsHeader}>
                      <Star size={18} color="#F59E0B" />
                      <Text style={styles.sleepTipsTitle}>Sleep Tips</Text>
                    </View>
                    <View style={styles.sleepTipsList}>
                      {stats.avgDailySleep < 840 && (
                        <View style={styles.sleepTipItem}>
                          <Clock size={16} color="#6B7280" />
                          <Text style={styles.sleepTipText}>
                            Aim for {formatHours(840)} of total sleep in 24 hours
                          </Text>
                        </View>
                      )}
                      {stats.avgNapsPerDay > 4 && (
                        <View style={styles.sleepTipItem}>
                          <Sun size={16} color="#6B7280" />
                          <Text style={styles.sleepTipText}>
                            Consider consolidating naps for longer sleep periods
                          </Text>
                        </View>
                      )}
                      {stats.avgWakeWindow > 240 && (
                        <View style={styles.sleepTipItem}>
                          <AlertCircle size={16} color="#6B7280" />
                          <Text style={styles.sleepTipText}>
                            Watch for signs of overtiredness between naps
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sleep Progress</Text>
              <View style={styles.progressCard}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressTitle}>Sleep Quality Score</Text>
                  <Text style={[styles.progressTrend, { 
                    color: stats.sleepQuality >= 90 ? '#10B981' : 
                           stats.sleepQuality >= 80 ? '#3B82F6' :
                           stats.sleepQuality >= 70 ? '#F59E0B' : '#EF4444'
                  }]}>
                    {stats.sleepQuality >= 90 ? "Excellent" :
                     stats.sleepQuality >= 80 ? "Good" :
                     stats.sleepQuality >= 70 ? "Fair" : "Needs Improvement"}
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { 
                    width: `${Math.min(stats.sleepQuality, 100)}%`,
                    backgroundColor: stats.sleepQuality >= 90 ? '#10B981' : 
                                   stats.sleepQuality >= 80 ? '#3B82F6' :
                                   stats.sleepQuality >= 70 ? '#F59E0B' : '#EF4444'
                  }]} />
                </View>
                <Text style={styles.progressText}>
                  {stats.sleepQuality >= 90 ? 
                    "Your baby's sleep pattern is excellent! Keep maintaining this schedule." :
                    stats.sleepQuality >= 80 ?
                    "Your baby is sleeping well. Minor adjustments could optimize their rest." :
                    stats.sleepQuality >= 70 ?
                    "Your baby's sleep could be improved. Consider adjusting their schedule." :
                    "Your baby might need more sleep. Let's work on improving their sleep routine."}
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginLeft: 10,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  periodText: {
    color: '#E5E7EB',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  periodTextActive: {
    color: '#7C3AED',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 50,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginTop: 12,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  patternCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  patternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  patternHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patternTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  analysisLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analysisLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  analysisContent: {
    gap: 24,
  },
  analysisSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  analysisSectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  patternDescription: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#4B5563',
    lineHeight: 24,
  },
  recommendationContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    overflow: 'hidden',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  recommendationHeaderText: {
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  recommendationContent: {
    padding: 16,
  },
  recommendationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4B5563',
    lineHeight: 22,
  },
  sleepTipsContainer: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
  },
  sleepTipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sleepTipsTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#92400E',
  },
  sleepTipsList: {
    gap: 12,
  },
  sleepTipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sleepTipText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4B5563',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  progressTrend: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#10B981',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
  alertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  alertInfo: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  alertWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  alertError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  alertText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  alertTextInfo: {
    color: '#1D4ED8',
  },
  alertTextWarning: {
    color: '#92400E',
  },
  alertTextError: {
    color: '#B91C1C',
  },
  alertCloseButton: {
    marginLeft: 12,
    padding: 4,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  noDataContent: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    width: '100%',
    maxWidth: 400,
  },
  noDataIconContainer: {
    marginBottom: 16,
  },
  noDataTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  noDataMessage: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  switchButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  switchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
});