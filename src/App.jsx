import React, { useState, useEffect, useRef } from 'react';
import { User, Calendar, Briefcase, Heart, Plus, Trash2, Gift, ChevronRight, Search, Copy, Check, Users, Upload, FileSpreadsheet, Download } from 'lucide-react';

/**
 * --- PHẦN 1: MÔ HÌNH HƯỚNG ĐỐI TƯỢNG (OOP MODEL) ---
 */

class Member {
  constructor(id, name, dob, gender, position, maritalStatus, unit) {
    this.id = id;
    this.name = name ? name.trim() : 'Không tên';
    this.dob = new Date(dob);
    this.gender = this.normalizeGender(gender); // 'male', 'female'
    this.position = this.normalizePosition(position); // 'staff', 'manager', 'leader'
    this.maritalStatus = this.normalizeMarital(maritalStatus); // 'single', 'married'
    this.unit = unit ? unit.trim() : 'Công ty';
  }

  // Chuẩn hóa dữ liệu đầu vào (để xử lý dữ liệu từ Excel nhập vào lộn xộn)
  normalizeGender(val) {
    if (!val) return 'male';
    const s = val.toString().toLowerCase().trim();
    if (s.includes('nữ') || s.includes('female') || s === 'f') return 'female';
    return 'male';
  }

  normalizePosition(val) {
    if (!val) return 'staff';
    const s = val.toString().toLowerCase().trim();
    if (s.includes('chủ tịch') || s.includes('giám đốc') || s.includes('lãnh đạo') || s.includes('phó')) return 'leader';
    if (s.includes('trưởng') || s.includes('phó phòng') || s.includes('quản lý')) return 'manager';
    return 'staff';
  }

  normalizeMarital(val) {
    if (!val) return 'single';
    const s = val.toString().toLowerCase().trim();
    if (s.includes('kết hôn') || s.includes('gia đình') || s.includes('có vợ') || s.includes('có chồng')) return 'married';
    return 'single';
  }

  getAge() {
    if (isNaN(this.dob)) return 0;
    const today = new Date();
    let age = today.getFullYear() - this.dob.getFullYear();
    const m = today.getMonth() - this.dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < this.dob.getDate())) {
      age--;
    }
    return age;
  }

  isBirthdayToday() {
    if (isNaN(this.dob)) return false;
    const today = new Date();
    return this.dob.getDate() === today.getDate() && 
           this.dob.getMonth() === today.getMonth();
  }

  getPronoun(myAge = 40) {
    const age = this.getAge();
    if (age > myAge) return this.gender === 'male' ? 'Anh' : 'Chị';
    if (age < myAge) return 'Em';
    return 'Bạn';
  }

  getPositionLabel() {
    const map = {
      'staff': 'Đoàn viên',
      'manager': 'Cán bộ quản lý',
      'leader': 'Lãnh đạo'
    };
    return map[this.position] || 'Đoàn viên';
  }
}

/**
 * --- PHẦN 2: LOGIC TẠO LỜI CHÚC (FACTORY PATTERN) ---
 */
class GreetingFactory {
  static generateWishes(member) {
    const pronoun = member.getPronoun();
    const options = [];

    // 1. Lời chúc Công việc (Có thêm yếu tố Đơn vị công tác)
    let workWish = `Chúc mừng sinh nhật ${pronoun} ${member.name}.`;
    if (member.position === 'leader') {
      workWish += ` Chúc ${pronoun.toLowerCase()} luôn bản lĩnh, vững tay chèo lái ${member.unit} ngày càng phát triển vững mạnh.`;
    } else if (member.position === 'manager') {
      workWish += ` Chúc ${pronoun.toLowerCase()} tuổi mới nhiều sức khỏe, hoàn thành xuất sắc nhiệm vụ tại ${member.unit}.`;
    } else {
      workWish += ` Chúc ${pronoun.toLowerCase()} luôn nhiệt huyết, hăng say lao động và gắn bó bền chặt với mái nhà chung ${member.unit}.`;
    }
    options.push({ type: 'Công việc', content: workWish });

    // 2. Lời chúc Đời sống (Hôn nhân & Giới tính)
    let lifeWish = `Happy Birthday ${member.name}! 🎉`;
    if (member.gender === 'female') {
      lifeWish += ` Chúc ${pronoun.toLowerCase()} mãi trẻ trung, xinh đẹp như hoa mùa xuân.`;
    } else {
      lifeWish += ` Chúc ${pronoun.toLowerCase()} tuổi mới thành công, phong độ ngời ngời.`;
    }

    if (member.maritalStatus === 'married') {
      lifeWish += ` Chúc gia đình nhỏ của ${pronoun.toLowerCase()} luôn ngập tràn tiếng cười và hạnh phúc viên mãn.`;
    } else {
      lifeWish += ` Chúc ${pronoun.toLowerCase()} sớm tìm được "mảnh ghép" hoàn hảo của đời mình nhé! ❤`;
    }
    options.push({ type: 'Tình cảm', content: lifeWish });

    // 3. Lời chúc Ngắn gọn
    let shortWish = `CMSN ${pronoun} ${member.name}! 🎂 Tuổi mới rực rỡ, tiền về như nước, công việc tại ${member.unit} luôn thuận buồm xuôi gió nhé!`;
    options.push({ type: 'Ngắn gọn', content: shortWish });

    return options;
  }
}

/**
 * --- PHẦN 3: HELPER XỬ LÝ EXCEL (DYNAMIC IMPORT) ---
 */
const ExcelHandler = {
  loadLibrary: () => {
    return new Promise((resolve, reject) => {
      if (window.XLSX) {
        resolve(window.XLSX);
        return;
      }
      const script = document.createElement('script');
      script.src = "https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js";
      script.async = true;
      script.onload = () => resolve(window.XLSX);
      script.onerror = () => reject(new Error("Failed to load XLSX library"));
      document.body.appendChild(script);
    });
  },

  downloadTemplate: () => {
    const data = [
      ["Họ và tên", "Ngày sinh", "Giới tính", "Chức vụ", "Đơn vị", "Tình trạng hôn nhân"],
      ["Nguyễn Văn A", "15/05/1990", "Nam", "Nhân viên", "Phòng Kỹ thuật", "Độc thân"],
      ["Trần Thị B", "20/10/1985", "Nữ", "Trưởng phòng", "Phòng Kế toán", "Đã kết hôn"]
    ];
    ExcelHandler.loadLibrary().then(XLSX => {
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "DanhSachMau");
      XLSX.writeFile(wb, "Mau_Danh_Sach_Doan_Vien.xlsx");
    });
  },

  parseFile: (file) => {
    return new Promise((resolve, reject) => {
      ExcelHandler.loadLibrary().then(XLSX => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            resolve(jsonData);
          } catch (error) {
            reject(error);
          }
        };
        reader.readAsArrayBuffer(file);
      });
    });
  }
};

/**
 * --- PHẦN 4: UI COMPONENTS ---
 */

const App = () => {
  // Dữ liệu mẫu ban đầu
  const initialData = [
    new Member(1, 'Trương Gia Bình', '1980-05-19', 'male', 'leader', 'married', 'Tập đoàn'),
    new Member(2, 'Nguyễn Thị Minh', '1995-11-28', 'female', 'staff', 'single', 'Kho vận'),
  ];

  const [members, setMembers] = useState(initialData);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // --- Logic Xử lý Import ---
  const handleImport = async (file) => {
    try {
      const rows = await ExcelHandler.parseFile(file);
      // rows[0] là header, bỏ qua
      if (rows.length < 2) return;

      const newMembers = [];
      const headers = rows[0].map(h => h.toString().toLowerCase());
      
      // Tìm chỉ số cột (Mapping thông minh)
      const idxName = headers.findIndex(h => h.includes('tên'));
      const idxDob = headers.findIndex(h => h.includes('sinh') || h.includes('dob'));
      const idxGender = headers.findIndex(h => h.includes('giới') || h.includes('sex'));
      const idxPos = headers.findIndex(h => h.includes('chức') || h.includes('vị trí'));
      const idxUnit = headers.findIndex(h => h.includes('đơn vị') || h.includes('phòng') || h.includes('ban'));
      const idxMarital = headers.findIndex(h => h.includes('hôn') || h.includes('gia đình'));

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row[idxName]) continue; // Bỏ qua dòng ko có tên

        // Xử lý ngày sinh phức tạp (Excel date serial number vs String)
        let dobDate = new Date();
        const rawDob = row[idxDob];
        if (typeof rawDob === 'number') {
            // Excel serial date to JS Date
            dobDate = new Date(Math.round((rawDob - 25569) * 86400 * 1000));
        } else if (typeof rawDob === 'string') {
            // Support dd/mm/yyyy
            const parts = rawDob.split('/');
            if (parts.length === 3) dobDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            else dobDate = new Date(rawDob);
        }

        newMembers.push(new Member(
          Date.now() + i, // Fake ID
          row[idxName],
          dobDate,
          row[idxGender],
          row[idxPos],
          row[idxMarital],
          row[idxUnit]
        ));
      }

      setMembers(prev => [...prev, ...newMembers]);
      alert(`Đã nhập thành công ${newMembers.length} đoàn viên!`);
      setShowImportModal(false);
      setActiveTab('list');
    } catch (err) {
      console.error(err);
      alert("Lỗi đọc file. Vui lòng kiểm tra lại định dạng.");
    }
  };

  // --- Sub-Components ---

  const Navigation = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-3 pb-6 shadow-[0_-5px_10px_rgba(0,0,0,0.05)] z-40">
      <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center ${activeTab === 'home' ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
        <Gift size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
        <span className="text-[10px] mt-1">Hôm nay</span>
      </button>
      <button onClick={() => setActiveTab('list')} className={`flex flex-col items-center ${activeTab === 'list' ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
        <Users size={24} strokeWidth={activeTab === 'list' ? 2.5 : 2} />
        <span className="text-[10px] mt-1">Danh sách</span>
      </button>
      <button onClick={() => setActiveTab('add')} className={`flex flex-col items-center ${activeTab === 'add' ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
        <Plus size={24} strokeWidth={activeTab === 'add' ? 2.5 : 2} />
        <span className="text-[10px] mt-1">Thêm mới</span>
      </button>
    </div>
  );

  const WishModal = ({ member, onClose }) => {
    if (!member) return null;
    const wishes = GreetingFactory.generateWishes(member);
    const [copiedIndex, setCopiedIndex] = useState(null);

    const handleCopy = (text, index) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch (err) {
            console.error(err);
        }
        document.body.removeChild(textArea);
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl h-[85vh] sm:h-auto flex flex-col">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex justify-between items-center shrink-0">
            <h3 className="font-bold text-lg flex items-center gap-2"><Gift size={20}/> Gợi ý lời chúc</h3>
            <button onClick={onClose} className="bg-white/20 p-1 rounded-full hover:bg-white/30 transition">
                <ChevronRight className="rotate-90 sm:rotate-0" size={20}/>
            </button>
          </div>
          
          <div className="p-4 bg-blue-50 shrink-0 border-b border-blue-100">
             <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md ${member.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'}`}>
                    {member.name.charAt(0)}
                </div>
                <div>
                    <h4 className="font-bold text-gray-800 text-lg">{member.name}</h4>
                    <p className="text-xs text-gray-600">{member.getPositionLabel()} • {member.unit}</p>
                    <p className="text-xs text-gray-500">{member.getAge()} tuổi • {member.maritalStatus === 'single' ? 'Độc thân' : 'Đã kết hôn'}</p>
                </div>
             </div>
          </div>

          <div className="p-4 space-y-4 overflow-y-auto flex-1">
            {wishes.map((wish, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                    {wish.type}
                  </span>
                  <button 
                    onClick={() => handleCopy(wish.content, idx)}
                    className={`flex items-center text-xs px-2 py-1 rounded transition-colors ${copiedIndex === idx ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600'}`}
                  >
                    {copiedIndex === idx ? <Check size={14} className="mr-1"/> : <Copy size={14} className="mr-1"/>}
                    {copiedIndex === idx ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed selection:bg-blue-100">{wish.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const ImportModal = () => {
    if (!showImportModal) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl relative">
                <button onClick={() => setShowImportModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
                <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-green-700">
                    <FileSpreadsheet size={24}/> Nhập từ Excel
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                    Hỗ trợ file .xlsx, .csv. Dòng đầu tiên phải là tiêu đề cột (Họ tên, Ngày sinh, Chức vụ...).
                </p>
                
                <div className="space-y-4">
                    <button 
                        onClick={ExcelHandler.downloadTemplate}
                        className="w-full flex items-center justify-center gap-2 p-3 border border-green-600 text-green-700 rounded-xl font-medium hover:bg-green-50 transition"
                    >
                        <Download size={18}/> Tải file mẫu
                    </button>

                    <div className="relative">
                        <input 
                            type="file" 
                            accept=".xlsx, .xls, .csv"
                            onChange={(e) => {
                                if(e.target.files[0]) handleImport(e.target.files[0]);
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <button className="w-full bg-green-600 text-white p-3 rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2 shadow-lg shadow-green-200">
                            <Upload size={18}/> Chọn file từ điện thoại
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
  }

  // --- Screens ---

  const Dashboard = () => {
    const todayBirthdays = members.filter(m => m.isBirthdayToday());
    const upcomingBirthdays = members.filter(m => {
      if (m.isBirthdayToday()) return false;
      const today = new Date();
      if (isNaN(m.dob)) return false;
      const dob = new Date(m.dob);
      dob.setFullYear(today.getFullYear());
      if (dob < today) dob.setFullYear(today.getFullYear() + 1);
      const diffDays = Math.ceil(Math.abs(dob - today) / (1000 * 60 * 60 * 24)); 
      return diffDays <= 30;
    }).sort((a, b) => {
        const today = new Date();
        const dA = new Date(a.dob); dA.setFullYear(today.getFullYear());
        if(dA < today) dA.setFullYear(today.getFullYear()+1);
        const dB = new Date(b.dob); dB.setFullYear(today.getFullYear());
        if(dB < today) dB.setFullYear(today.getFullYear()+1);
        return dA - dB;
    });

    return (
      <div className="space-y-6 pb-24 animate-fade-in">
        <header className="bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 pt-12 pb-8 px-6 rounded-b-[2.5rem] text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <div className="relative z-10">
                <h1 className="text-3xl font-bold">Xin chào! 👋</h1>
                <p className="opacity-90 mt-1 font-light text-blue-100">Cùng gửi lời yêu thương đến đoàn viên.</p>
                <div className="mt-6 flex gap-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 flex-1 border border-white/10">
                        <span className="block text-2xl font-bold">{todayBirthdays.length}</span>
                        <span className="text-xs opacity-80">Sinh nhật hôm nay</span>
                    </div>
                     <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 flex-1 border border-white/10">
                        <span className="block text-2xl font-bold">{upcomingBirthdays.length}</span>
                        <span className="text-xs opacity-80">Sắp tới (30 ngày)</span>
                    </div>
                </div>
            </div>
        </header>

        <div className="px-5">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    <Gift className="text-red-500" size={20} fill="currentColor" fillOpacity={0.2}/>
                    Hôm nay
                </h2>
            </div>
            
          {todayBirthdays.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-200">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Gift className="text-gray-300" size={30}/>
               </div>
              <p className="text-gray-400 text-sm">Hôm nay không có sinh nhật nào.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayBirthdays.map(member => (
                <div key={member.id} className="bg-white p-4 rounded-2xl shadow-lg shadow-red-50 border border-red-50 flex items-center justify-between transform transition hover:scale-[1.02]">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-100 to-pink-100 text-red-600 flex items-center justify-center font-bold text-lg shadow-inner">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{member.name}</h3>
                      <p className="text-xs text-gray-500 bg-gray-100 inline-block px-2 py-0.5 rounded-full mt-1">{member.unit}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedMember(member)}
                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-red-200 active:scale-95 transition-all"
                  >
                    Chúc mừng
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5">
           <h2 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
             <Calendar className="text-blue-500" size={20}/> Sắp tới
           </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
            {upcomingBirthdays.map(member => {
                const today = new Date();
                const d = new Date(member.dob);
                return (
                    <div key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl">
                        <div className="flex items-center space-x-4">
                            <div className="text-center min-w-[3rem] p-2 bg-blue-50 rounded-xl">
                                <span className="block text-[10px] font-bold text-blue-400 uppercase">Tháng {d.getMonth()+1}</span>
                                <span className="block text-xl font-bold text-blue-600">{d.getDate()}</span>
                            </div>
                            <div>
                                <p className="font-bold text-gray-800 text-sm">{member.name}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{member.unit}</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedMember(member)} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition">
                            <Gift size={16} />
                        </button>
                    </div>
                )
            })}
             {upcomingBirthdays.length === 0 && <p className="p-6 text-center text-gray-400 text-sm">Không có sinh nhật nào trong 30 ngày tới.</p>}
          </div>
        </div>
      </div>
    );
  };

  const MemberList = () => {
    const [filter, setFilter] = useState('');
    const filteredMembers = members.filter(m => 
        m.name.toLowerCase().includes(filter.toLowerCase()) || 
        m.unit.toLowerCase().includes(filter.toLowerCase())
    );

    return (
      <div className="pb-24 h-full flex flex-col bg-gray-50 min-h-screen">
        <div className="bg-white px-5 py-4 shadow-sm sticky top-0 z-10">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-2xl font-bold text-gray-800">Đoàn viên</h2>
             <button 
                onClick={() => setShowImportModal(true)}
                className="text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
             >
                <FileSpreadsheet size={16}/> Nhập Excel
             </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm tên, đơn vị..." 
              className="w-full pl-10 pr-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>
        
        <div className="p-5 space-y-3 flex-1 overflow-y-auto">
          {filteredMembers.map(member => (
            <div key={member.id} className="bg-white p-4 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm ${member.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'}`}>
                  {member.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">{member.name}</h3>
                  <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                    <Briefcase size={10}/> {member.unit}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <button 
                  onClick={() => setSelectedMember(member)}
                  className="w-8 h-8 flex items-center justify-center text-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                >
                  <Gift size={16} />
                </button>
                <button 
                  onClick={() => setMembers(members.filter(m => m.id !== member.id))}
                  className="w-8 h-8 flex items-center justify-center text-red-400 bg-red-50 rounded-lg hover:bg-red-100 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {filteredMembers.length === 0 && (
             <div className="text-center py-10 opacity-50">
                <Users size={40} className="mx-auto mb-2"/>
                <p>Không tìm thấy kết quả</p>
             </div>
          )}
        </div>
      </div>
    );
  };

  const AddMemberForm = () => {
    const [formData, setFormData] = useState({
      name: '', dob: '', gender: 'male', position: 'staff', maritalStatus: 'single', unit: ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      const newMember = new Member(
          Date.now(),
          formData.name,
          formData.dob,
          formData.gender,
          formData.position,
          formData.maritalStatus,
          formData.unit
      );
      setMembers(prev => [...prev, newMember]);
      setActiveTab('list');
    };

    return (
      <div className="pb-24 bg-gray-50 min-h-screen">
         <div className="bg-white p-5 shadow-sm sticky top-0 z-10 mb-4">
             <h2 className="text-2xl font-bold text-gray-800">Thêm thủ công</h2>
         </div>
        
        <form onSubmit={handleSubmit} className="px-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Họ và tên</label>
                <input required type="text" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-blue-500 outline-none transition"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nhập họ tên đầy đủ"/>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ngày sinh</label>
                    <input required type="date" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-blue-500 outline-none transition"
                    value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})}/>
                </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Đơn vị</label>
                    <input required type="text" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-blue-500 outline-none transition"
                    value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} placeholder="Phòng/Ban"/>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Giới tính</label>
                    <select className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none"
                        value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hôn nhân</label>
                    <select className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none"
                        value={formData.maritalStatus} onChange={e => setFormData({...formData, maritalStatus: e.target.value})}>
                        <option value="single">Độc thân</option>
                        <option value="married">Đã kết hôn</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Chức vụ</label>
                <div className="grid grid-cols-3 gap-2">
                {[
                    {id: 'staff', label: 'Đoàn viên', icon: User},
                    {id: 'manager', label: 'Quản lý', icon: Briefcase},
                    {id: 'leader', label: 'Lãnh đạo', icon: Heart}
                ].map(pos => (
                    <button key={pos.id} type="button" onClick={() => setFormData({...formData, position: pos.id})}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${formData.position === pos.id ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
                    <pos.icon size={20} className="mb-1" />
                    <span className="text-[10px] font-bold">{pos.label}</span>
                    </button>
                ))}
                </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 mt-4 active:scale-95 transition-transform flex items-center justify-center gap-2">
            <Plus size={20}/> Lưu đoàn viên
          </button>
        </form>
      </div>
    );
  };

  return (
    <div className="font-sans text-gray-900 bg-gray-100 min-h-screen flex justify-center items-start pt-0 sm:pt-10">
      <div className="w-full sm:max-w-md bg-gray-50 min-h-screen sm:min-h-[800px] sm:h-[800px] sm:rounded-[2.5rem] shadow-2xl overflow-hidden relative border-[8px] border-gray-900 sm:border-gray-200">
        
        {/* Fake Status Bar for Mobile Look */}
        <div className="h-6 bg-blue-700 w-full absolute top-0 left-0 z-50 opacity-0 sm:opacity-100 sm:rounded-t-[2rem]"></div>

        <div className="h-full overflow-y-auto no-scrollbar pt-0 sm:pt-6">
            {activeTab === 'home' && <Dashboard />}
            {activeTab === 'list' && <MemberList />}
            {activeTab === 'add' && <AddMemberForm />}
        </div>

        {selectedMember && <WishModal member={selectedMember} onClose={() => setSelectedMember(null)} />}
        <ImportModal />
        <Navigation />
      </div>
    </div>
  );
};

export default App;