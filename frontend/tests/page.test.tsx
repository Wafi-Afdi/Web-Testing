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
    jest.clearAllMocks();
    global.fetch = mockFetch({ doctors: mockDoctors, queue: mockQueue });
  });

  test('renders page header and form title', async () => {
    render(<HomePage />);
    expect(screen.getByText('Pendaftaran Antrean Online')).toBeInTheDocument();
    expect(screen.getByText('Formulir Pendaftaran Antrean')).toBeInTheDocument();
  });

  test('loads and displays doctors in the select dropdown', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Dr. Budi Santoso - Umum')).toBeInTheDocument();
    });
    expect(screen.getByText('Dr. Siti Aminah - Anak')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Dr. Budi Santoso - Umum' })).toBeInTheDocument();
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
    fireEvent.change(doctorSelect, { target: { value: mockDoctors[1].id.toString() } });
    expect(doctorSelect.value).toBe(mockDoctors[1].id.toString());
  });

  test('allows user to select a time slot', () => {
    render(<HomePage />);
    const timeSlotSelect = screen.getByRole('combobox', { name: /Pilih Waktu Kunjungan/i }) as HTMLSelectElement;
    fireEvent.change(timeSlotSelect, { target: { value: '10:00 - 10:30' } });
    expect(timeSlotSelect.value).toBe('10:00 - 10:30');
  });


  test('displays current and upcoming queue', async () => {
     global.fetch = mockFetch({ doctors: mockDoctors, queue: [
        { queue_number: 'NOW01', name: 'Currently Serving Patient', doctor_data: 'Dr. Test Current', date_start: new Date().toISOString(), date_end: new Date(new Date().getTime() + 30*60000).toISOString() },
        { queue_number: 'NEXT01', name: 'Upcoming Patient 1', doctor_data: 'Dr. Test Next', date_start: new Date(new Date().getTime() + 60*60000).toISOString(), date_end: new Date(new Date().getTime() + 90*60000).toISOString() },
        { queue_number: 'NEXT02', name: 'Upcoming Patient 2', doctor_data: 'Dr. Test Next', date_start: new Date(new Date().getTime() + 120*60000).toISOString(), date_end: new Date(new Date().getTime() + 150*60000).toISOString() },
    ] });
    render(<HomePage />);

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