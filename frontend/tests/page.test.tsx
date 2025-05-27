import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import HomePage from '../src/app/page';
import '@testing-library/jest-dom';

const API_BASE_URL = 'http://localhost:3500';

const mockDoctors = [
  { id: 1, name: 'Dr. Budi Santoso', spesialisasi: 'Umum', doctorId: 1 },
  { id: 2, name: 'Dr. Siti Aminah', spesialisasi: 'Anak', doctorId: 2 },
];

const mockQueue = [
  {
    queue_number: 'A001',
    name: 'Pasien Satu',
    doctor_data: 'Dr. Budi Santoso',
    date_start: new Date().toISOString(),
    date_end: new Date(new Date().getTime() + 30 * 60000).toISOString(),
  },
];

const mockNewPatientResponse = {
    new_patient: {
        queue_number: 'A002',
        name: 'Pasien Test',
        doctor_id: 1,
        date_start: new Date().toISOString(),
        date_end: new Date(new Date().getTime() + 30 * 60000).toISOString(),
    }
};

// Fungsi helper untuk mock fetch
const mockFetch = (data, ok = true, status = 200) => {
  return jest.fn().mockImplementation((url) => {
    if (url === `${API_BASE_URL}/appointment/doctors`) {
      return Promise.resolve({
        ok: ok,
        status: status,
        json: () => Promise.resolve(data && data.doctors ? { doctors: data.doctors } : { doctors: [] }),
      });
    }
    if (url === `${API_BASE_URL}/appointment` && global.fetch.mock.calls.some(call => call[1]?.method === 'POST')) {
       return Promise.resolve({
        ok: ok,
        status: status,
        json: () => Promise.resolve(data && data.new_patient ? data : mockNewPatientResponse),
      });
    }
    if (url === `${API_BASE_URL}/appointment`) {
       return Promise.resolve({
        ok: ok,
        status: status,
        json: () => Promise.resolve(data && data.queue ? { queue: data.queue } : { queue: [] }),
      });
    }
    return Promise.reject(new Error(`Unhandled request: ${url}`));
  });
};


describe('HomePage', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Mock fetch untuk setiap test case, bisa dioverride di dalam test jika perlu
    global.fetch = mockFetch({ doctors: mockDoctors, queue: mockQueue });
  });

  test('renders page header and form title', async () => {
    render(<HomePage />);
    expect(screen.getByText('Pendaftaran Antrean Online')).toBeInTheDocument();
    expect(screen.getByText('Formulir Pendaftaran Antrean')).toBeInTheDocument();
  });

  test('loads and displays doctors in the select dropdown', async () => {
    render(<HomePage />);

    // Tunggu hingga loading dokter selesai dan opsi dokter muncul
    await waitFor(() => {
      expect(screen.getByText('Dr. Budi Santoso - Umum')).toBeInTheDocument();
    });
    expect(screen.getByText('Dr. Siti Aminah - Anak')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Dr. Budi Santoso - Umum' })).toBeInTheDocument();
  });

  test('shows error if doctors fail to load', async () => {
    global.fetch = mockFetch(null, false, 500); // Simulate fetch error
    render(<HomePage />);

    await waitFor(() => {
        expect(screen.getByText('Tidak dapat memuat daftar dokter. Coba lagi nanti.')).toBeInTheDocument();
    });
  });


  test('allows user to input patient name', () => {
    render(<HomePage />);
    const nameInput = screen.getByPlaceholderText('Masukkan nama lengkap Anda') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    expect(nameInput.value).toBe('John Doe');
  });

  test('allows user to select a doctor', async () => {
    render(<HomePage />);
    await waitFor(() => {
      expect(screen.getByText('Dr. Budi Santoso - Umum')).toBeInTheDocument();
    });

    const doctorSelect = screen.getByRole('combobox', { name: /Pilih Dokter/i }) as HTMLSelectElement;
    fireEvent.change(doctorSelect, { target: { value: mockDoctors[1].id.toString() } }); // Pilih Dr. Siti Aminah
    expect(doctorSelect.value).toBe(mockDoctors[1].id.toString());
  });

  test('allows user to select a time slot', () => {
    render(<HomePage />);
    const timeSlotSelect = screen.getByRole('combobox', { name: /Pilih Waktu Kunjungan/i }) as HTMLSelectElement;
    fireEvent.change(timeSlotSelect, { target: { value: '10:00 - 10:30' } });
    expect(timeSlotSelect.value).toBe('10:00 - 10:30');
  });

  test('shows error message if patient name is empty on submit', async () => {
    render(<HomePage />);
    const submitButton = screen.getByRole('button', { name: 'Daftar Antrean' });
    fireEvent.click(submitButton);

    expect(await screen.findByText('Nama pasien wajib diisi.')).toBeInTheDocument();
  });

   test('shows error message if patient name is too long on submit', async () => {
    render(<HomePage />);
    const nameInput = screen.getByPlaceholderText('Masukkan nama lengkap Anda');
    fireEvent.change(nameInput, { target: { value: 'a'.repeat(51) } });

    const submitButton = screen.getByRole('button', { name: 'Daftar Antrean' });
    fireEvent.click(submitButton);

    expect(await screen.findByText('Nama pasien tidak boleh lebih dari 50 karakter.')).toBeInTheDocument();
  });


  test('opens confirmation modal on successful form submission trigger', async () => {
    render(<HomePage />);

    await waitFor(() => expect(screen.getByRole('option', { name: /Dr. Budi Santoso/i })).toBeInTheDocument());

    const nameInput = screen.getByPlaceholderText('Masukkan nama lengkap Anda');
    const doctorSelect = screen.getByRole('combobox', { name: /Pilih Dokter/i });
    const timeSlotSelect = screen.getByRole('combobox', { name: /Pilih Waktu Kunjungan/i });
    const submitButton = screen.getByRole('button', { name: 'Daftar Antrean' });

    fireEvent.change(nameInput, { target: { value: 'Pasien Test' } });
    fireEvent.change(doctorSelect, { target: { value: mockDoctors[0].id.toString() } });
    fireEvent.change(timeSlotSelect, { target: { value: '09:00 - 09:30' } });

    act(() => {
      fireEvent.click(submitButton);
    });

    const modal = await screen.findByTestId("confirmation-modal", {}, { timeout: 2000 }); // timeout opsional, bisa disesuaikan
    expect(modal).toBeInTheDocument();

    const modalTitle = within(modal).getByRole('heading', { name: 'Konfirmasi Pendaftaran', level: 3 });
    expect(modalTitle).toBeInTheDocument();

    expect(within(modal).getByText('Pasien Test')).toBeInTheDocument();
    expect(within(modal).getByText((content, element) => content.includes('Dr. Budi Santoso') && content.includes('(Umum)'))).toBeInTheDocument();
    expect(within(modal).getByText('09:00 - 09:30')).toBeInTheDocument();
  });

  test('handles successful registration and displays confirmation message', async () => {
    global.fetch = mockFetch({
        doctors: mockDoctors,
        queue: mockQueue, // Initial queue
        new_patient: mockNewPatientResponse.new_patient // Response untuk POST
    });


    render(<HomePage />);

    await waitFor(() => expect(screen.getByRole('option', { name: /Dr. Budi Santoso/i })).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText('Masukkan nama lengkap Anda'), { target: { value: 'Pasien Test' } });
    fireEvent.change(screen.getByRole('combobox', { name: /Pilih Dokter/i }), { target: { value: mockDoctors[0].id.toString() } });
    fireEvent.change(screen.getByRole('combobox', { name: /Pilih Waktu Kunjungan/i }), { target: { value: '09:00 - 09:30' } });

    fireEvent.click(screen.getByRole('button', { name: 'Daftar Antrean' }));

    // Modal konfirmasi terbuka
    const confirmButton = await screen.findByRole('button', { name: 'Ya, Konfirmasi' });
    expect(confirmButton).toBeInTheDocument();

    // Klik tombol konfirmasi di modal
    // Kita perlu `act` di sini karena state update (isSubmitting, confirmation, dll) terjadi secara asynchronous setelah fetch
    await act(async () => {
      fireEvent.click(confirmButton);
    });

    // Tunggu pesan sukses muncul
    await waitFor(() => {
      expect(screen.getByText('Pendaftaran Berhasil!')).toBeInTheDocument();
    });
    expect(screen.getByText(`Nomor Antrean:`)).toBeInTheDocument();
    expect(screen.getByText(mockNewPatientResponse.new_patient.queue_number)).toBeInTheDocument(); // Cek nomor antrean baru
    expect(screen.getByText('Pasien Test')).toBeInTheDocument(); // Nama pasien di konfirmasi
    expect(screen.getByText('Dr. Budi Santoso (Umum)')).toBeInTheDocument(); // Dokter di konfirmasi
    expect(screen.getByText('09:00 - 09:30')).toBeInTheDocument(); // Waktu di konfirmasi

    // Cek apakah input form direset (opsional, tergantung implementasi)
    // expect((screen.getByPlaceholderText('Masukkan nama lengkap Anda') as HTMLInputElement).value).toBe('');
  });

   test('handles registration failure from API and displays error message', async () => {
    // Mock fetch untuk POST request yang gagal
    global.fetch = jest.fn((url, options) => {
      if (url === `${API_BASE_URL}/appointment/doctors`) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ doctors: mockDoctors }),
        });
      }
      if (url === `${API_BASE_URL}/appointment` && options?.method === 'POST') {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ message: 'Jadwal sudah penuh.' }),
        });
      }
      if (url === `${API_BASE_URL}/appointment`) {
         return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ queue: mockQueue }),
        });
      }
      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });

    render(<HomePage />);

    await waitFor(() => expect(screen.getByRole('option', { name: /Dr. Budi Santoso/i })).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText('Masukkan nama lengkap Anda'), { target: { value: 'Pasien Gagal' } });
    fireEvent.change(screen.getByRole('combobox', { name: /Pilih Dokter/i }), { target: { value: mockDoctors[0].id.toString() } });
    fireEvent.change(screen.getByRole('combobox', { name: /Pilih Waktu Kunjungan/i }), { target: { value: '09:00 - 09:30' } });

    fireEvent.click(screen.getByRole('button', { name: 'Daftar Antrean' }));

    const confirmButton = await screen.findByRole('button', { name: 'Ya, Konfirmasi' });

    await act(async () => {
      fireEvent.click(confirmButton);
    });

    // Tunggu pesan error dari API muncul
    await waitFor(() => {
      expect(screen.getByText('Jadwal sudah penuh.')).toBeInTheDocument();
    });
    // Pastikan modal tertutup dan tidak ada konfirmasi sukses
    expect(screen.queryByText('Pendaftaran Berhasil!')).not.toBeInTheDocument();
  });


  test('closes confirmation modal when "Batal" is clicked', async () => {
    render(<HomePage />);
    await waitFor(() => expect(screen.getByRole('option', { name: /Dr. Budi Santoso/i })).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText('Masukkan nama lengkap Anda'), { target: { value: 'Pasien Test Modal' } });
    fireEvent.change(screen.getByRole('combobox', { name: /Pilih Dokter/i }), { target: { value: mockDoctors[0].id.toString() } });
    fireEvent.change(screen.getByRole('combobox', { name: /Pilih Waktu Kunjungan/i }), { target: { value: '09:00 - 09:30' } });

    fireEvent.click(screen.getByRole('button', { name: 'Daftar Antrean' }));

    const modalTitle = await screen.findByText('Konfirmasi Pendaftaran');
    expect(modalTitle).toBeInTheDocument();

    const cancelButton = screen.getByRole('button', { name: 'Batal' });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Konfirmasi Pendaftaran')).not.toBeInTheDocument();
    });
  });

  test('displays current and upcoming queue', async () => {
     global.fetch = mockFetch({ doctors: mockDoctors, queue: [
        { queue_number: 'NOW01', name: 'Currently Serving Patient', doctor_data: 'Dr. Test Current', date_start: new Date().toISOString(), date_end: new Date(new Date().getTime() + 30*60000).toISOString() },
        { queue_number: 'NEXT01', name: 'Upcoming Patient 1', doctor_data: 'Dr. Test Next', date_start: new Date(new Date().getTime() + 60*60000).toISOString(), date_end: new Date(new Date().getTime() + 90*60000).toISOString() },
        { queue_number: 'NEXT02', name: 'Upcoming Patient 2', doctor_data: 'Dr. Test Next', date_start: new Date(new Date().getTime() + 120*60000).toISOString(), date_end: new Date(new Date().getTime() + 150*60000).toISOString() },
    ] });
    render(<HomePage />);

    // Tunggu loading queue selesai
    await waitFor(() => {
      expect(screen.getByText('Antrean Saat Ini Dilayani')).toBeInTheDocument();
      expect(screen.getByText('NOW01')).toBeInTheDocument(); // Nomor antrean saat ini
      expect(screen.getByText('Currently Serving Patient')).toBeInTheDocument(); // Nama pasien saat ini
    });

    expect(screen.getByText('Daftar Antrean Berikutnya')).toBeInTheDocument();
    expect(screen.getByText('NEXT01')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Patient 1')).toBeInTheDocument();
    expect(screen.getByText('NEXT02')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Patient 2')).toBeInTheDocument();
  });

  test('displays message if no doctors are available', async () => {
    global.fetch = mockFetch({ doctors: [], queue: [] }); // No doctors
    render(<HomePage />);

    await waitFor(() => {
        expect(screen.getByText('Tidak ada dokter tersedia.')).toBeInTheDocument();
    });
     // Tombol submit harusnya disabled jika tidak ada dokter
    const submitButton = screen.getByRole('button', { name: 'Daftar Antrean' });
    expect(submitButton).toBeDisabled();
  });

   test('displays message if queue is empty', async () => {
    global.fetch = mockFetch({ doctors: mockDoctors, queue: [] }); // Empty queue
    render(<HomePage />);

    await waitFor(() => {
        expect(screen.getByText('Belum ada pasien dalam antrean yang dilayani.')).toBeInTheDocument();
    });
    await waitFor(() => {
        expect(screen.getByText('Belum ada pasien yang mendaftar.')).toBeInTheDocument();
    });
  });

});