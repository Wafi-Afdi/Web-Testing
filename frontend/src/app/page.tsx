'use client';

import Head from 'next/head';
import { useState, useEffect, useCallback } from 'react';
import { Users, Clock, Stethoscope, CheckCircle, AlertTriangle, ListChecks, UserCheck, X, Check, Loader2 } from 'lucide-react';

//API URL
const API_BASE_URL = 'http://localhost:3500';

const initialTimeSlots = ['09:00 - 09:30', '09:30 - 10:00', '10:00 - 10:30', '10:30 - 11:00', '13:00 - 13:30', '13:30 - 14:00'];

export default function HomePage() {
  const [patientName, setPatientName] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedTime, setSelectedTime] = useState(initialTimeSlots[0] || '');

  const [doctorsList, setDoctorsList] = useState([]);
  const [patientQueue, setPatientQueue] = useState([]);

  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDoctors = useCallback(async () => {
    setIsLoadingDoctors(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/doctors`);
      if (!response.ok) {
        throw new Error(`Gagal mengambil data dokter: ${response.statusText}`);
      }
      const data = await response.json();
      const formattedDoctors = data.map(doc => ({
        ...doc,
        specialization: doc.spesialisasi
      }));
      setDoctorsList(formattedDoctors);
      if (formattedDoctors.length > 0 && !selectedDoctorId) {
        setSelectedDoctorId(formattedDoctors[0].id);
      }
    } catch (err) {
      console.error(err);
      setError('Tidak dapat memuat daftar dokter. Coba lagi nanti.');
    } finally {
      setIsLoadingDoctors(false);
    }
  }, [selectedDoctorId]);

  const fetchQueue = useCallback(async () => {
    setIsLoadingQueue(true);
    // setError(''); // Jangan hapus error form saat refresh antrian
    try {
      const response = await fetch(`${API_BASE_URL}/`);
      if (!response.ok) {
        throw new Error(`Gagal mengambil data antrean: ${response.statusText}`);
      }
      const data = await response.json();
      const formattedQueue = data.map(patient => ({
        queueNumber: patient.queue_number,
        name: patient.name,
        doctorName: patient.doctor_data,
        time: new Date(patient.date_start).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date(patient.date_end).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        registeredAt: patient.date_start,
      }));
      setPatientQueue(formattedQueue);
    } catch (err) {
      console.error(err);
      setError('Tidak dapat memuat data antrean. Coba lagi nanti.');
    } finally {
      setIsLoadingQueue(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
    fetchQueue();
  }, [fetchDoctors, fetchQueue]);


  const handleSubmitForm = (e) => {
    e.preventDefault();
    setError('');
    setConfirmation(null);

    if (!patientName.trim()) {
      setError('Nama pasien wajib diisi.');
      return;
    }
    if (patientName.length > 50) {
      setError('Nama pasien tidak boleh lebih dari 50 karakter.');
      return;
    }
    if (!selectedDoctorId) {
      setError('Silakan pilih dokter.');
      return;
    }
    if (!selectedTime) {
        setError('Silakan pilih waktu kunjungan.');
        return;
    }

    const doctor = doctorsList.find(doc => String(doc.id) === String(selectedDoctorId));
    if (!doctor) {
      setError('Pilihan dokter tidak valid.');
      return;
    }

    setModalData({
      name: patientName.trim(),
      doctorId: selectedDoctorId,
      doctorName: doctor.name,
      doctorSpecialization: doctor.specialization,
      time: selectedTime,
    });
    setIsModalOpen(true);
  };

  const handleConfirmRegistration = async () => {
    if (!modalData) return;
    setIsSubmitting(true);
    setError('');
    setConfirmation(null);

    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const [startTimeStr, endTimeStr] = modalData.time.split(' - ');

      const appointmentData = {
        name: modalData.name,
        doctor_id: parseInt(modalData.doctorId, 10),
        date_start: `${today}T${startTimeStr}:00.000+07:00`, // +07:00 (WIB)
        date_end: `${today}T${endTimeStr}:00.000+07:00`,   // +07:00 (WIB)
      };

      const response = await fetch(`${API_BASE_URL}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Gagal mendaftar: ${response.statusText}` }));
        throw new Error(errorData.message || `Gagal mendaftar: ${response.statusText}`);
      }

      const newPatientRegistered = await response.json();

      setConfirmation({
        queueNumber: newPatientRegistered.queue_number,
        name: newPatientRegistered.name,
        doctorName: modalData.doctorName,
        doctorSpecialization: modalData.doctorSpecialization,
        time: modalData.time,
      });
      fetchQueue(); // Refresh daftar antrean

      setPatientName('');
      setSelectedDoctorId(doctorsList[0]?.id || '');
      setSelectedTime(initialTimeSlots[0] || '');

    } catch (err) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat mendaftar. Coba lagi.');
    } finally {
      setIsSubmitting(false);
      setIsModalOpen(false);
      setModalData(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalData(null);
  };

  const currentlyServing = patientQueue.length > 0 ? patientQueue[0] : null;
  const upcomingQueue = patientQueue.length > 0 ? patientQueue.slice(1) : [];

  const handleCallNext = async () => {
    if (patientQueue.length > 0) {
        setConfirmation(null);
        await fetchQueue();
    }
  };

  return (
    <>
      <Head>
        <title>Sistem Antrean Online Rumah Sakit</title>
        <meta name="description" content="Pendaftaran antrean pasien rumah sakit secara online" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-cyan-50 to-green-50 py-8 px-4 font-sans">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-indigo-700">Pendaftaran Antrean Online</h1>
          <p className="text-lg text-gray-600 mt-2">Rumah Sakit Teknik Jaya - Pendaftaran Cepat dan Mudah</p>
        </header>

        <main className="container mx-auto max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="bg-white p-6 md:p-8 rounded-xl shadow-2xl">
            <h2 className="text-2xl font-semibold text-indigo-600 mb-6 flex items-center">
              <Users className="mr-3 h-7 w-7 text-indigo-500" />
              Formulir Pendaftaran Antrean
            </h2>

            <form onSubmit={handleSubmitForm} className="space-y-6">
              <div>
                <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Pasien <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="patientName"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  maxLength={50}
                  className="w-full px-4 py-2.5 text-gray-800 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                  placeholder="Masukkan nama lengkap Anda"
                />
              </div>

              <div>
                <label htmlFor="doctor" className="block text-sm font-medium text-gray-700 mb-1">
                  Pilih Dokter <span className="text-red-500">*</span>
                </label>
                {isLoadingDoctors ? (
                  <div className="flex items-center justify-center h-10">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                  </div>
                ) : doctorsList.length > 0 ? (
                  <select
                    id="doctor"
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full px-4 py-2.5 text-gray-800 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 bg-white"
                  >
                    <option value="" disabled>-- Pilih Dokter --</option>
                    {doctorsList.map(doc => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} - {doc.specialization}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-gray-500">Tidak ada dokter tersedia.</p>
                )}
              </div>

              <div>
                <label htmlFor="timeSlot" className="block text-sm font-medium text-gray-700 mb-1">
                  Pilih Waktu Kunjungan <span className="text-red-500">*</span>
                </label>
                <select
                  id="timeSlot"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-4 py-2.5 text-gray-800 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 bg-white"
                >
                  {initialTimeSlots.map(slot => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-md flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-3"/>
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoadingDoctors || isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2"/> : null}
                Daftar Antrean
              </button>
            </form>

            {confirmation && (
              <div className="mt-8 bg-green-50 border-l-4 border-green-500 text-green-700 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold mb-3 flex items-center">
                    <CheckCircle className="h-6 w-6 mr-2 text-green-600"/>
                    Pendaftaran Berhasil!
                </h3>
                <p className="mb-1"><strong className="font-medium">Nomor Antrean:</strong> <span className="text-2xl font-bold text-green-600">{confirmation.queueNumber}</span></p>
                <p className="mb-1"><strong className="font-medium">Nama:</strong> {confirmation.name}</p>
                <p className="mb-1"><strong className="font-medium">Dokter:</strong> {confirmation.doctorName} ({confirmation.doctorSpecialization})</p>
                <p><strong className="font-medium">Waktu:</strong> {confirmation.time}</p>
              </div>
            )}
          </section>

          <section className="bg-white p-6 md:p-8 rounded-xl shadow-2xl space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-purple-600 mb-4 flex items-center">
                <UserCheck className="mr-3 h-7 w-7 text-purple-500"/>
                Antrean Saat Ini Dilayani
              </h2>
              {isLoadingQueue ? (
                <div className="flex items-center justify-center h-20">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                </div>
              ) : currentlyServing ? (
                <div className="bg-purple-50 p-6 rounded-lg border border-purple-200 shadow-md">
                  <p className="text-4xl font-bold text-purple-700 mb-2">{currentlyServing.queueNumber}</p>
                  <p className="text-lg text-gray-800">{currentlyServing.name}</p>
                  <p className="text-sm text-gray-600">Dokter: {currentlyServing.doctorName}</p>
                  <p className="text-sm text-gray-600">Waktu: {currentlyServing.time}</p>
                  <button
                    onClick={handleCallNext}
                    disabled={isSubmitting}
                    className="mt-4 w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin inline-block mr-2"/> : null}
                    Panggil Pasien Berikutnya
                  </button>
                </div>
              ) : (
                <p className="text-gray-500 italic p-4 bg-gray-50 rounded-md text-center">Belum ada pasien dalam antrean yang dilayani.</p>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-teal-600 mb-4 flex items-center">
                <ListChecks className="mr-3 h-7 w-7 text-teal-500"/>
                Daftar Antrean Berikutnya
              </h2>
              {isLoadingQueue ? (
                 <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
                </div>
              ) : upcomingQueue.length > 0 ? (
                <ul className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                  {upcomingQueue.map(patient => (
                    <li key={patient.queueNumber} className="bg-teal-50 p-4 rounded-lg border border-teal-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-semibold text-teal-700">{patient.queueNumber}</span>
                        <span className="text-xs bg-teal-200 text-teal-800 px-2 py-0.5 rounded-full">{patient.time}</span>
                      </div>
                      <p className="text-md text-gray-700 mt-1">{patient.name}</p>
                      <p className="text-sm text-gray-500">Dokter: {patient.doctorName}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                 currentlyServing ? (
                    <p className="text-gray-500 italic p-4 bg-gray-50 rounded-md text-center">Tidak ada pasien lain dalam antrean.</p>
                 ) : (
                    <p className="text-gray-500 italic p-4 bg-gray-50 rounded-md text-center">Belum ada pasien yang mendaftar.</p>
                 )
              )}
            </div>
          </section>
        </main>

        <footer className="text-center mt-12 py-6 border-t border-gray-300">
            <p className="text-gray-600">&copy; {new Date().getFullYear()} Rumah Sakit Teknik Jaya.</p>
            <p className="text-gray-400">Dikembangkan oleh Kelompok 7 - Mata Kuliah Pengujian Perangkat Lunak</p>
        </footer>
      </div>

      {isModalOpen && modalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out">
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-in-out scale-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-indigo-600">Konfirmasi Pendaftaran</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={28} />
              </button>
            </div>
            <div className="space-y-4 mb-8">
              <div>
                <p className="text-sm font-medium text-gray-500">Nama Pasien:</p>
                <p className="text-lg text-gray-800">{modalData.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Dokter Tujuan:</p>
                <p className="text-lg text-gray-800">{modalData.doctorName} ({modalData.doctorSpecialization})</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Waktu Kunjungan:</p>
                <p className="text-lg text-gray-800">{modalData.time}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleConfirmRegistration}
                disabled={isSubmitting}
                className="w-full sm:w-auto flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-150 ease-in-out flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2"/> : <Check size={20} className="mr-2"/>}
                Ya, Konfirmasi
              </button>
              <button
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="w-full sm:w-auto flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition duration-150 ease-in-out flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X size={20} className="mr-2"/> Batal
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1; // slate-300
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8; // slate-500
        }
        body {
          font-family: 'Inter', sans-serif;
        }
      `}</style>
    </>
  );
}
