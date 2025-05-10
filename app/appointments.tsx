// Add these functions right after resetForm() and before the return statement:

  const handleDeleteAppointment = async (id: string) => {
    Alert.alert(
      'Delete Appointment',
      'Are you sure you want to delete this appointment?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteAppointment(id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete appointment');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleEmailSummary = async (appointmentId: string) => {
    try {
      const summary = await generateHealthSummary(appointmentId);
      setEmailContent(summary);
      setSelectedAppointmentId(appointmentId);
      setShowEmailPreview(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate health summary');
    }
  };

  const renderDateTimePicker = () => {
    return (
      <View style={styles.dateTimeContainer}>
        <TouchableOpacity
          style={styles.dateTimeButton}
          onPress={() => setShowDatePicker(true)}>
          <Calendar size={20} color="#6B7280" />
          <Text style={styles.dateTimeButtonText}>
            {format(selectedDate, 'MMMM d, yyyy')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateTimeButton}
          onPress={() => setShowTimePicker(true)}>
          <Clock size={20} color="#6B7280" />
          <Text style={styles.dateTimeButtonText}>
            {format(selectedDate, 'h:mm a')}
          </Text>
        </TouchableOpacity>

        {(showDatePicker || showTimePicker) && (
          <DateTimePicker
            value={showDatePicker ? tempDate : selectedDate}
            mode={showDatePicker ? 'date' : 'time'}
            is24Hour={false}
            onChange={showDatePicker ? handleDateChange : handleTimeChange}
          />
        )}
      </View>
    );
  };