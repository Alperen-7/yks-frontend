"use client";
import React, { useState, useEffect, useRef } from 'react';
import yksData from '../data/data.json';

type CategoryType = keyof typeof yksData;

// Sabit Öğrenci Şifresi
const STUDENT_PASSWORD = "1234";

const getTodayDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getAdminPassword = () => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}${month}`;
};

const Sidebar = ({ 
  activeScreen,
  onHomeClick,
  onStudentClick, 
  onAdminClick 
}: { 
  activeScreen: string,
  onHomeClick: () => void,
  onStudentClick: () => void, 
  onAdminClick: () => void 
}) => {
  
  const isHome = activeScreen === "home";
  const isStudent = ["studentLogin", "form", "quiz", "result"].includes(activeScreen);
  const isAdmin = ["adminLogin", "admin"].includes(activeScreen);

  return (
    <div className="w-72 h-screen bg-slate-900 text-white fixed left-0 top-0 flex flex-col shadow-2xl z-50 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-br from-indigo-600 to-blue-700 opacity-20 -skew-y-12 transform origin-top-left z-0"></div>
      
      <div className="p-8 text-3xl font-extrabold tracking-tight cursor-pointer relative z-10 flex items-center gap-3" onClick={onHomeClick}>
        <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-xl">🚀</span>
        </div>
        YKS<span className="text-indigo-400 font-light">Takip</span>
      </div>
      
      <nav className="flex-1 px-6 space-y-2 mt-6 relative z-10">
        <button 
          onClick={onHomeClick}
          className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl transition-all duration-300 text-sm font-semibold mb-6 
            ${isHome ? "bg-white/10 text-white shadow-lg backdrop-blur-sm border border-white/5" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
        >
          <span className="text-lg">🏠</span> Anasayfa
        </button>

        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-3 px-2">Öğrenci Portalı</div>
        <button 
          onClick={onStudentClick}
          className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl transition-all duration-300 text-sm font-semibold 
            ${isStudent ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/50" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
        >
          <span className="text-lg">📚</span> Çalışma Girişi
        </button>
        
        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-3 px-2 mt-10">Yönetim Paneli</div>
        <button 
          onClick={onAdminClick}
          className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl transition-all duration-300 text-sm font-semibold 
            ${isAdmin ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-teal-900/50" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
        >
          <span className="text-lg">📊</span> Günlük Raporlar
        </button>
      </nav>
    </div>
  );
};

export default function Home() {
  const RDP_IP = "192.168.1.110"; 

  // RENDER KOMUTUNU/BAĞLANTISINI BURAYA EKLEYEBİLİRSİN
  const RENDER_URL = process.env.NEXT_PUBLIC_RENDER_URL || `https://yks-backend-csn4.onrender.com`;

  const [activeScreen, setActiveScreen] = useState("home");
  
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("TYT");
  const lessons = Object.keys(yksData[selectedCategory]);
  const [selectedLesson, setSelectedLesson] = useState(lessons[0]);
  
  const topics = (yksData[selectedCategory] as any)[selectedLesson];
  const [selectedTopic, setSelectedTopic] = useState(topics[0]);

  const [studyType, setStudyType] = useState("konu");
  const [description, setDescription] = useState("");
  const [stats, setStats] = useState({ total: "", correct: "", incorrect: "", empty: "" });
  const [examType, setExamType] = useState("TYT");
  const [errorMessage, setErrorMessage] = useState("");
  const todayDate = getTodayDate();

  const [currentQuestions, setCurrentQuestions] = useState<any[]>([]);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: number }>({});
  const [quizScore, setQuizScore] = useState(0);
  const [pendingRecord, setPendingRecord] = useState<any>(null);
  
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [isStudentAuth, setIsStudentAuth] = useState(false);
  
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [studentPasswordInput, setStudentPasswordInput] = useState("");
  
  const [adminDate, setAdminDate] = useState(todayDate);
  const [dbRecords, setDbRecords] = useState<any[]>([]);
  
  const [activeAdminTab, setActiveAdminTab] = useState("logs");

  const studentPassRef = useRef<HTMLInputElement>(null);
  const adminPassRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeScreen === "studentLogin" && studentPassRef.current) {
      studentPassRef.current.focus();
    } else if (activeScreen === "adminLogin" && adminPassRef.current) {
      adminPassRef.current.focus();
    }
  }, [activeScreen]);

  useEffect(() => {
    if (activeScreen === "admin") {
      fetchAdminRecords();
    }
  }, [activeScreen]);

  const fetchAdminRecords = async () => {
    try {
      const response = await fetch(`${RENDER_URL}/get-records/`);
      const data = await response.json();
      if (data.status === "success") {
        setDbRecords(data.data);
      }
    } catch (error) {
      console.error("Raporlar çekilemedi", error);
    }
  };

  const saveRecordToDB = async (recordData: any) => {
    try {
      await fetch(`${RENDER_URL}/save-record/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordData)
      });
      fetchAdminRecords();
    } catch (error) {
      console.error("Veritabanına kaydedilemedi:", error);
      alert("Kayıt veritabanına iletilemedi. Sunucu bağlantınızı kontrol edin.");
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value as CategoryType;
    setSelectedCategory(newCategory);
    const newLessons = Object.keys(yksData[newCategory]);
    setSelectedLesson(newLessons[0]);
    setSelectedTopic((yksData[newCategory] as any)[newLessons[0]][0]);
  };

  const handleLessonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLesson = e.target.value;
    setSelectedLesson(newLesson);
    setSelectedTopic((yksData[selectedCategory] as any)[newLesson][0]);
  };

  const handleStatsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStats({ ...stats, [e.target.name]: e.target.value });
    setErrorMessage(""); 
  };

  const totalQ = parseInt(stats.total) || 0;
  const correctQ = parseInt(stats.correct) || 0;
  const incorrectQ = parseInt(stats.incorrect) || 0;
  const emptyQ = parseInt(stats.empty) || 0;
  const calculatedNet = correctQ - (incorrectQ / 4);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(""); 
    
    const isDeneme = studyType === "deneme";

    if (studyType === "soru") {
      if (totalQ === 0) {
        setErrorMessage("Lütfen geçerli bir 'Toplam Soru' sayısı giriniz.");
        return;
      }
      const sum = correctQ + incorrectQ + emptyQ;
      if (sum !== totalQ) {
        setErrorMessage(`HATA: Doğru, Yanlış ve Boş toplamı ${sum} yapıyor! Toplam soru sayısına (${totalQ}) eşit olmalı.`);
        return;
      }
    }

    if (isDeneme) {
      const maxQuestions = examType === "TYT" ? 120 : 80;
      const sum = correctQ + incorrectQ + emptyQ;
      if (sum !== maxQuestions) {
        setErrorMessage(`HATA: ${examType} denemesinde toplam ${maxQuestions} soru olmalıdır!`);
        return;
      }
    }

    const newRecord = {
      date: todayDate,
      category: isDeneme ? examType : selectedCategory,
      lesson: isDeneme ? "Genel Deneme" : selectedLesson,
      topic: isDeneme ? examType : selectedTopic,
      studyType: studyType,
      description: studyType === "konu" ? description : null,
      stats: studyType !== "konu" ? { ...stats, net: isDeneme ? calculatedNet : null } : null,
      examType: isDeneme ? examType : null,
      quizQuestions: [],
      userAnswers: {},
      quizScore: 0
    };

    if (isDeneme) {
      await saveRecordToDB(newRecord);
      alert(`🎯 ${examType} Deneme analizi başarıyla kaydedildi! Netiniz: ${calculatedNet.toFixed(2)}`);
      setStats({ total: "", correct: "", incorrect: "", empty: "" });
      return; 
    }

    const questionLimit = studyType === "konu" ? 1 : 3;
    try {
      const response = await fetch(`${RENDER_URL}/get-questions/?category=${selectedCategory}&lesson=${selectedLesson}&topic=${selectedTopic}&limit=${questionLimit}`);
      const data = await response.json();

      if (data.status === "success" && data.data && data.data.length > 0) {
        setPendingRecord(newRecord);
        setCurrentQuestions(data.data);
        setUserAnswers({}); 
        setActiveScreen("quiz");
      } 
      else {
        await saveRecordToDB(newRecord);
        alert("✅ Çalışmanız başarıyla kaydedildi! (Bu konuda henüz test sorusu bulunamadı, ancak kayıt alındı.)");
        setDescription("");
        setStats({ total: "", correct: "", incorrect: "", empty: "" });
      }
    } catch (error) {
      await saveRecordToDB(newRecord);
      alert("✅ Çalışmanız kaydedildi. (Sunucuya bağlanılamadı, test soruları şu an yüklenemedi.)");
      setDescription("");
      setStats({ total: "", correct: "", incorrect: "", empty: "" });
    }
  };

  const handleOptionSelect = (questionId: number, optionIndex: number) => {
    setUserAnswers({ ...userAnswers, [questionId]: optionIndex });
  };

  const handleQuizSubmit = async () => {
    if (Object.keys(userAnswers).length < currentQuestions.length) {
      alert("Lütfen tüm soruları cevaplayınız.");
      return;
    }

    let correctCount = 0;
    currentQuestions.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const finalRecord = {
      ...pendingRecord,
      quizQuestions: currentQuestions,
      userAnswers: userAnswers,
      quizScore: correctCount
    };

    await saveRecordToDB(finalRecord);
    setQuizScore(correctCount);
    setActiveScreen("result");
  };

  const handleStudentPassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, 4);
    setStudentPasswordInput(val);
    
    if (val.length === 4) {
      if (val === STUDENT_PASSWORD) {
        setIsStudentAuth(true);
        setActiveScreen("form");
        setStudentPasswordInput("");
      } else {
        alert("Hatalı öğrenci şifresi!");
        setStudentPasswordInput("");
      }
    }
  };

  const handleAdminPassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, 4);
    setAdminPasswordInput(val);
    
    if (val.length === 4) {
      if (val === getAdminPassword()) {
        setIsAdminAuth(true);
        setActiveScreen("admin");
        setAdminPasswordInput("");
      } else {
        alert("Hatalı şifre!");
        setAdminPasswordInput("");
      }
    }
  };

  const goHome = () => {
    setIsAdminAuth(false);
    setIsStudentAuth(false);
    setActiveScreen("home");
  };

  const goStudentPanel = () => {
    setIsAdminAuth(false);
    if (isStudentAuth) {
      setActiveScreen("form");
    } else {
      setActiveScreen("studentLogin");
    }
  };

  const goAdminPanel = () => {
    setIsStudentAuth(false);
    if (isAdminAuth) {
      setActiveScreen("admin");
    } else {
      setActiveScreen("adminLogin");
    }
  };

  const dailyRecords = dbRecords.filter(r => r.date === adminDate);
  const lessonStats: Record<string, { total: number, correct: number, incorrect: number, empty: number, net: number }> = {};
  
  if (activeScreen === "admin") {
    dailyRecords.forEach(record => {
      if (record.studyType === "soru") {
        const lesson = record.lesson;
        if (!lessonStats[lesson]) {
          lessonStats[lesson] = { total: 0, correct: 0, incorrect: 0, empty: 0, net: 0 };
        }
        
        const t = parseInt(record.stats?.total) || 0;
        const c = parseInt(record.stats?.correct) || 0;
        const i = parseInt(record.stats?.incorrect) || 0;
        const e = parseInt(record.stats?.empty) || 0;
        const n = c - (i / 4);
        
        lessonStats[lesson].total += t;
        lessonStats[lesson].correct += c;
        lessonStats[lesson].incorrect += i;
        lessonStats[lesson].empty += e;
        lessonStats[lesson].net += n;
      }
    });
  }
  const chartLessons = Object.keys(lessonStats);

  const historicalDenemeler = dbRecords
    .filter(r => r.studyType === "deneme")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
  const tytDenemeler = historicalDenemeler.filter(r => r.examType === "TYT");
  const ydtDenemeler = historicalDenemeler.filter(r => r.examType === "YDT");

  return (
    <div className="flex min-h-screen font-sans text-slate-800 bg-slate-50">
      <Sidebar 
        activeScreen={activeScreen}
        onHomeClick={goHome}
        onStudentClick={goStudentPanel} 
        onAdminClick={goAdminPanel} 
      />
      
      <div className="ml-72 flex-1 p-10 overflow-x-hidden">
        
        {/* =====================
            EKRAN: ANASAYFA
            ===================== */}
        {activeScreen === "home" && (
          <div className="max-w-5xl mx-auto mt-12">
            <div className="text-center mb-16">
              <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 mb-4 tracking-tight">
                Geleceğe Giden Yolu Yönetin.
              </h1>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                YKS hazırlık sürecinde her soruyu, her konuyu ve her denemeyi detaylıca analiz edin. İşlemlerinize başlamak için aşağıdaki panellerden birini seçin.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <button 
                onClick={goStudentPanel}
                className="group relative overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-200/50 border border-slate-100 transition-all duration-300 hover:-translate-y-2 text-left"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                <div className="p-10 relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-3xl text-white shadow-lg shadow-indigo-200 mb-6 group-hover:scale-105 transition-transform">
                    🎒
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Öğrenci Portalı</h3>
                  <p className="text-slate-500 leading-relaxed">
                    Günlük çalışmalarını kaydet, soru çözümlerini analiz et ve akıllı sistemimizle seviyeni ölç.
                  </p>
                  <div className="mt-8 flex items-center text-indigo-600 font-semibold group-hover:gap-2 transition-all">
                    Giriş Yap <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </div>
                </div>
              </button>

              <button 
                onClick={goAdminPanel}
                className="group relative overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-emerald-200/50 border border-slate-100 transition-all duration-300 hover:-translate-y-2 text-left"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                <div className="p-10 relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-3xl text-white shadow-lg shadow-emerald-200 mb-6 group-hover:scale-105 transition-transform">
                    📈
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Yönetim Paneli</h3>
                  <p className="text-slate-500 leading-relaxed">
                    Öğrencinin gelişimini izle, günlük performans raporlarını incele ve istatistikleri görselleştir.
                  </p>
                  <div className="mt-8 flex items-center text-emerald-600 font-semibold group-hover:gap-2 transition-all">
                    Giriş Yap <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* =====================
            EKRAN: ÖĞRENCİ GİRİŞİ
            ===================== */}
        {activeScreen === "studentLogin" && (
          <div className="max-w-md mx-auto mt-24 bg-white p-10 rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
              🎒
            </div>
            <h2 className="text-2xl font-bold mb-2 text-slate-800">Öğrenci Girişi</h2>
            <p className="text-sm text-slate-500 mb-8">Devam etmek için şifreni gir.</p>
            
            <input 
              ref={studentPassRef}
              type="password" 
              maxLength={4}
              value={studentPasswordInput}
              onChange={handleStudentPassChange}
              className="w-full text-center text-4xl tracking-[1em] pl-4 border-2 border-slate-200 rounded-2xl p-5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all shadow-sm font-mono text-slate-700"
              placeholder="••••"
            />
          </div>
        )}

        {/* =====================
            EKRAN: ADMİN GİRİŞİ
            ===================== */}
        {activeScreen === "adminLogin" && (
          <div className="max-w-md mx-auto mt-24 bg-white p-10 rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-teal-600"></div>
            <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
              🔒
            </div>
            <h2 className="text-2xl font-bold mb-2 text-slate-800">Yönetici Girişi</h2>
            <p className="text-sm text-slate-500 mb-8">Lütfen güvenlik kodunu giriniz.</p>
            
            <input 
              ref={adminPassRef}
              type="password" 
              maxLength={4}
              value={adminPasswordInput}
              onChange={handleAdminPassChange}
              className="w-full text-center text-4xl tracking-[1em] pl-4 border-2 border-slate-200 rounded-2xl p-5 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 outline-none transition-all shadow-sm font-mono text-slate-700"
              placeholder="••••"
            />
          </div>
        )}

        {/* =====================
            ÖĞRENCİ: FORM EKRANI
            ===================== */}
        {activeScreen === "form" && (
          <div className="max-w-3xl mx-auto bg-white p-10 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100">
            <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-6">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-xl">📝</div>
              <h2 className="text-2xl font-bold text-slate-800">Yeni Çalışma Oturumu</h2>
            </div>
            
            <form className="space-y-8" onSubmit={handleSubmit}>
              
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Çalışma Türü</label>
                  <select 
                    value={studyType} 
                    onChange={(e) => {
                      setStudyType(e.target.value);
                      setErrorMessage("");
                      setStats({ total: "", correct: "", incorrect: "", empty: "" });
                    }} 
                    className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none bg-white transition-all shadow-sm font-medium text-slate-700"
                  >
                    <option value="konu">📖 Konu Anlatımı</option>
                    <option value="soru">✏️ Soru Çözümü</option>
                    <option value="deneme">🎯 Deneme Sınavı</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tarih</label>
                  <input 
                    type="date" 
                    value={todayDate}
                    readOnly
                    className="w-full border-2 border-slate-200 rounded-xl p-3 bg-slate-100 text-slate-400 cursor-not-allowed outline-none shadow-sm font-medium" 
                  />
                </div>
              </div>

              {studyType !== "deneme" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">Kategori</label>
                      <select value={selectedCategory} onChange={handleCategoryChange} className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white transition-all">
                        <option value="TYT">TYT</option>
                        <option value="YDT">YDT</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">Ders</label>
                      <select value={selectedLesson} onChange={handleLessonChange} className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white transition-all">
                        {lessons.map((lesson) => (
                          <option key={lesson} value={lesson}>{lesson}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Konu</label>
                    <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)} className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white transition-all">
                      {topics.map((topic: string) => (
                        <option key={topic} value={topic}>{topic}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              
              {studyType === "konu" && (
                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                  <label className="block text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                    <span>📝</span> Öğrenilenler ve Anahtar Kelimeler
                  </label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Bugün bu konudan neler öğrendin? Kendine kısa notlar bırak..." 
                    className="w-full border-2 border-blue-100 rounded-xl p-4 h-32 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none bg-white resize-none transition-all"
                    required
                  />
                </div>
              )}

              {studyType === "soru" && (
                <div className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100">
                  <h3 className="font-bold text-orange-800 mb-5 flex items-center gap-2"><span>📊</span> Soru Analizi</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Toplam Soru</label>
                      <input type="number" name="total" value={stats.total} onChange={handleStatsChange} className="w-full border-2 border-slate-200 p-3 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none font-bold text-center" placeholder="0" min="0" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-green-600 mb-1">Doğru</label>
                      <input type="number" name="correct" value={stats.correct} onChange={handleStatsChange} className="w-full border-2 border-green-200 bg-green-50 p-3 rounded-xl focus:border-green-500 outline-none font-bold text-green-700 text-center" placeholder="0" min="0" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-red-600 mb-1">Yanlış</label>
                      <input type="number" name="incorrect" value={stats.incorrect} onChange={handleStatsChange} className="w-full border-2 border-red-200 bg-red-50 p-3 rounded-xl focus:border-red-500 outline-none font-bold text-red-700 text-center" placeholder="0" min="0" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Boş</label>
                      <input type="number" name="empty" value={stats.empty} onChange={handleStatsChange} className="w-full border-2 border-slate-200 bg-white p-3 rounded-xl focus:border-slate-400 outline-none font-bold text-slate-600 text-center" placeholder="0" min="0" required />
                    </div>
                  </div>
                </div>
              )}

              {studyType === "deneme" && (
                <div className="bg-purple-50/50 p-8 rounded-3xl border border-purple-100">
                  <h3 className="font-bold text-xl text-purple-900 mb-6 flex items-center gap-2"><span>🎯</span> Deneme Sınavı Analizi</h3>
                  
                  <div className="mb-8">
                    <label className="block text-sm font-bold text-purple-800 mb-2">Sınav Türü Seçimi</label>
                    <select 
                      value={examType} 
                      onChange={(e) => {
                        setExamType(e.target.value);
                        setErrorMessage("");
                      }} 
                      className="w-full border-2 border-purple-200 rounded-xl p-4 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 bg-white shadow-sm font-bold text-purple-900"
                    >
                      <option value="TYT">TYT (120 Soru)</option>
                      <option value="YDT">YDT (80 Soru)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-4 gap-4 items-end mb-8">
                    <div>
                      <label className="block text-xs font-bold text-green-700 mb-2 text-center uppercase tracking-wider">Doğru</label>
                      <input type="number" name="correct" value={stats.correct} onChange={handleStatsChange} className="w-full border-2 border-green-200 bg-green-50/50 p-4 rounded-2xl text-center font-black text-2xl text-green-700 focus:border-green-500 outline-none transition-all" placeholder="0" min="0" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-red-700 mb-2 text-center uppercase tracking-wider">Yanlış</label>
                      <input type="number" name="incorrect" value={stats.incorrect} onChange={handleStatsChange} className="w-full border-2 border-red-200 bg-red-50/50 p-4 rounded-2xl text-center font-black text-2xl text-red-700 focus:border-red-500 outline-none transition-all" placeholder="0" min="0" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2 text-center uppercase tracking-wider">Boş</label>
                      <input type="number" name="empty" value={stats.empty} onChange={handleStatsChange} className="w-full border-2 border-slate-200 bg-white p-4 rounded-2xl text-center font-black text-2xl text-slate-600 focus:border-slate-400 outline-none transition-all" placeholder="0" min="0" required />
                    </div>
                    <div className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white p-4 rounded-2xl text-center shadow-lg shadow-purple-900/20 flex flex-col justify-center h-[76px]">
                      <span className="block text-[10px] uppercase font-bold text-purple-200 mb-1">Hedef Soru</span>
                      <span className="font-black text-2xl leading-none">{examType === "TYT" ? 120 : 80}</span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-purple-100 flex justify-between items-center shadow-sm">
                     <span className="font-bold text-purple-900 text-lg uppercase tracking-wider flex items-center gap-2">
                       <span className="text-2xl">🏆</span> Hesaplanan Net
                     </span>
                     <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                       { calculatedNet.toFixed(2) }
                     </span>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-r-xl flex items-center gap-3 font-medium shadow-sm">
                  <span className="text-xl">⚠️</span> {errorMessage}
                </div>
              )}

              <div className="pt-4">
                <button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl px-6 py-5 hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-blue-900/20 active:scale-[0.98] transition-all text-lg flex items-center justify-center gap-2"
                >
                  {studyType === "deneme" ? "💾 Sistemi Kaydet ve Raporla" : "🧠 Seviye Kontrolüne Geç"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =====================
            ÖĞRENCİ: QUIZ EKRANI
            ===================== */}
        {activeScreen === "quiz" && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200 px-8 py-6 rounded-3xl mb-8 shadow-sm flex items-start gap-4">
              <span className="text-4xl mt-1">🤔</span>
              <div>
                <h3 className="font-extrabold text-xl text-amber-900 mb-1">ÖSYM Seni Test Ediyor: {selectedTopic}</h3>
                <p className="text-amber-800 font-medium">
                  {currentQuestions.length === 1 
                    ? "Konuyu gerçekten anladığını kanıtlamak için ÖSYM'nin geçmiş yıllarda sorduğu bu 1 soruyu doğru yanıtlamalısın." 
                    : `Bu çalışmayı tamamlayabilmek için ÖSYM'nin geçmiş yıllarda sorduğu aşağıdaki ${currentQuestions.length} soruyu yanıtlamalısın.`}
                </p>
              </div>
            </div>

            <div className="space-y-8">
              {currentQuestions.map((q, index) => (
                <div key={q.id} className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                    <span className="font-black text-xl text-slate-800">Soru {index + 1}</span>
                    <span className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-full font-bold text-sm tracking-wide">{q.year}</span>
                  </div>
                  <p className="text-slate-800 mb-8 font-semibold text-lg leading-relaxed">{q.question}</p>
                  
                  <div className="space-y-3">
                    {q.options.map((option: string, optIndex: number) => {
                      const isSelected = userAnswers[q.id] === optIndex;
                      return (
                        <label 
                          key={optIndex} 
                          className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                            isSelected 
                              ? "bg-indigo-50 border-indigo-500 text-indigo-900 shadow-sm" 
                              : "hover:bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          <input 
                            type="radio" 
                            name={`question-${q.id}`} 
                            className="hidden"
                            checked={isSelected}
                            onChange={() => handleOptionSelect(q.id, optIndex)}
                          />
                          <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${isSelected ? "border-indigo-500" : "border-slate-300"}`}>
                            {isSelected && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></div>}
                          </div>
                          <span className={isSelected ? "font-bold" : "font-medium"}>{option}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex justify-end">
              <button 
                onClick={handleQuizSubmit}
                className="bg-slate-900 text-white font-bold rounded-2xl px-10 py-5 hover:bg-black shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center gap-3 text-lg"
              >
                Cevapları Onayla <span className="text-2xl">👉</span>
              </button>
            </div>
          </div>
        )}

        {/* =====================
            ÖĞRENCİ: QUIZ SONUCU
            ===================== */}
        {activeScreen === "result" && (
          <div className="max-w-xl mx-auto bg-white p-12 rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 text-center">
            <div className="text-8xl mb-6">{quizScore >= Math.ceil(currentQuestions.length / 2) ? "🎉" : "⚠️"}</div>
            <h2 className="text-4xl font-black mb-4 text-slate-900">
              {currentQuestions.length} Soruda {quizScore} Doğru
            </h2>
            <p className="text-slate-500 mb-10 text-lg">
              {quizScore >= Math.ceil(currentQuestions.length / 2) 
                ? "Harika iş çıkardın! Bu konuyu iyice kavramış görünüyorsun." 
                : "Biraz daha tekrar yapmanda fayda var. Pes etmek yok!"}
            </p>
            
            <button 
              onClick={() => {
                setActiveScreen("form");
                setDescription("");
                setStats({ total: "", correct: "", incorrect: "", empty: "" });
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl px-6 py-5 hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-indigo-900/20 active:scale-95 transition-all text-lg"
            >
              Yeni Çalışma Ekle
            </button>
          </div>
        )}

        {/* =====================
            YÖNETİCİ: RAPOR EKRANI
            ===================== */}
        {activeScreen === "admin" && (
          <div className="max-w-6xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-10 bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100">
              <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-4">
                <span className="p-3 bg-teal-50 rounded-2xl text-teal-600">📊</span> Yönetici Paneli
              </h2>
              <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                <label className="font-bold text-sm text-slate-500 uppercase tracking-wider pl-4">Filtrele:</label>
                <input 
                  type="date" 
                  value={adminDate}
                  onChange={(e) => setAdminDate(e.target.value)}
                  className="bg-white border-none rounded-xl p-3 focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer font-bold text-slate-700 shadow-sm"
                />
              </div>
            </div>

            <div className="flex gap-4 mb-10 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 inline-flex">
              <button 
                onClick={() => setActiveAdminTab("logs")}
                className={`px-8 py-3 rounded-xl font-bold transition-all ${activeAdminTab === "logs" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"}`}
              >
                📖 Günlük Analiz
              </button>
              <button 
                onClick={() => setActiveAdminTab("stats")}
                className={`px-8 py-3 rounded-xl font-bold transition-all ${activeAdminTab === "stats" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"}`}
              >
                📈 Görsel Grafikler
              </button>
            </div>

            {activeAdminTab === "logs" && dailyRecords.length === 0 ? (
              <div className="bg-white p-16 rounded-3xl shadow-sm border border-slate-100 text-center flex flex-col items-center justify-center">
                <span className="text-6xl mb-4 opacity-50">📭</span>
                <p className="text-xl text-slate-500 font-medium">
                  <span className="font-bold text-slate-700">{adminDate}</span> tarihinde henüz bir veri girilmemiş.
                </p>
              </div>
            ) : (
              <>
                {/* --- SEKME 1: ÇALIŞMA GÜNLÜĞÜ (Detaylar) --- */}
                {activeAdminTab === "logs" && (
                  <div className="space-y-8">
                    {dailyRecords.map((record) => (
                      <div key={record.id} className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 relative overflow-hidden">
                        
                        <div className="absolute top-0 right-0 bg-gradient-to-bl from-slate-900 to-slate-700 text-white text-xs font-black px-6 py-2 rounded-bl-2xl uppercase tracking-widest shadow-sm">
                          {record.studyType === "konu" ? "Konu Anlatımı" : record.studyType === "soru" ? "Soru Çözümü" : "Deneme Sınavı"}
                        </div>

                        <div className="mb-8">
                          <h3 className="font-extrabold text-2xl text-slate-900 mb-2">{record.category} - {record.lesson}</h3>
                          <p className="text-slate-500 font-medium">Konu / Sınav Türü: <span className="font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg ml-2">{record.topic}</span></p>
                        </div>

                        {record.studyType === "konu" && (
                          <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 mb-4 shadow-inner">
                            <span className="font-black text-blue-900 block mb-2 uppercase text-xs tracking-wider">Öğrencinin Notları:</span>
                            <p className="text-blue-800 font-medium leading-relaxed">{record.description}</p>
                          </div>
                        )}

                        {(record.studyType === "soru" || record.studyType === "deneme") && record.stats && (
                          <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 mb-4">
                            {record.studyType === "soru" && (
                              <div className="bg-slate-50 border border-slate-200 px-4 py-4 rounded-2xl text-center shadow-sm">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Toplam</span>
                                <span className="font-black text-xl text-slate-700">{record.stats.total}</span>
                              </div>
                            )}
                            <div className="bg-green-50 border border-green-200 px-4 py-4 rounded-2xl text-center shadow-sm">
                                <span className="block text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1">Doğru</span>
                                <span className="font-black text-xl text-green-700">{record.stats.correct}</span>
                            </div>
                            <div className="bg-red-50 border border-red-200 px-4 py-4 rounded-2xl text-center shadow-sm">
                                <span className="block text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1">Yanlış</span>
                                <span className="font-black text-xl text-red-700">{record.stats.incorrect}</span>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 px-4 py-4 rounded-2xl text-center shadow-sm">
                                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Boş</span>
                                <span className="font-black text-xl text-slate-600">{record.stats.empty}</span>
                            </div>
                            {record.studyType === "deneme" && (
                              <div className="bg-gradient-to-br from-purple-600 to-indigo-600 px-4 py-4 rounded-2xl text-center shadow-md sm:col-span-1 col-span-4">
                                <span className="block text-[10px] font-bold text-purple-200 uppercase tracking-wider mb-1">Net</span>
                                <span className="font-black text-xl text-white">{record.stats.net.toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {record.quizQuestions && record.quizQuestions.length > 0 && (
                          <div className="mt-8 border-t-2 border-slate-100 pt-6">
                            <h4 className="font-bold text-sm text-slate-800 mb-6 flex justify-between items-center">
                              <span className="uppercase tracking-wider text-slate-500 font-black">ÖSYM Seviye Kontrolü</span>
                              <span className={`px-4 py-2 rounded-xl font-black ${record.quizScore >= Math.ceil(record.quizQuestions.length / 2) ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                Skor: {record.quizScore} / {record.quizQuestions.length}
                              </span>
                            </h4>
                            
                            <div className="space-y-4">
                              {record.quizQuestions.map((q: any, i: number) => {
                                const userAnswerIndex = record.userAnswers[q.id];
                                const isCorrect = userAnswerIndex === q.correctAnswer;
                                
                                return (
                                  <div key={q.id} className={`p-6 rounded-2xl border-2 ${isCorrect ? "bg-green-50/30 border-green-200" : "bg-red-50/30 border-red-200"}`}>
                                    <p className="text-sm font-bold text-slate-800 mb-4">{i + 1}. {q.question}</p>
                                    
                                    <div className="text-sm space-y-2">
                                      {q.options.map((opt: string, optIndex: number) => {
                                        let style = "text-slate-500 flex items-start gap-2";
                                        let icon = "⚪";
                                        
                                        if (optIndex === q.correctAnswer) {
                                          style = "font-black text-green-700 flex items-start gap-2 bg-green-100/50 p-2 rounded-lg";
                                          icon = "✅";
                                        } else if (optIndex === userAnswerIndex && !isCorrect) {
                                          style = "font-bold text-red-600 line-through flex items-start gap-2 bg-red-50 p-2 rounded-lg";
                                          icon = "❌";
                                        }
                                        
                                        return (
                                          <div key={optIndex} className={style}>
                                            <span className="mt-0.5">{icon}</span> <span>{opt}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* --- SEKME 2: İSTATİSTİKSEL ANALİZ (Görsel Grafikler) --- */}
                {activeAdminTab === "stats" && (
                  <div className="space-y-16">
                    
                    {/* --- BÖLÜM 1: GÜNLÜK SORU ÇÖZÜMÜ --- */}
                    {chartLessons.length > 0 ? (
                      <div>
                        <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
                          <span className="text-3xl">📚</span> Günlük Soru Çözümü Analizi (Derslere Göre)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                          {chartLessons.map(lesson => (
                            <div key={lesson} className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-center mb-8">
                                  <h3 className="text-2xl font-black text-slate-800">{lesson}</h3>
                                  <span className="p-2 bg-slate-50 rounded-lg border text-xl">📊</span>
                                </div>
                                
                                <div className="relative h-48 border-l-4 border-b-4 border-slate-100 mb-10 mx-4">
                                  <div 
                                    className="absolute bg-gradient-to-t from-blue-600 to-indigo-500 rounded-full shadow-lg shadow-blue-500/40 flex items-center justify-center text-white text-sm font-black transition-all duration-1000 ease-out z-10 border-4 border-white"
                                    style={{ 
                                      width: '48px', 
                                      height: '48px', 
                                      bottom: `${Math.min((lessonStats[lesson].total / 200) * 100, 100)}%`,
                                      left: '50%',
                                      transform: 'translate(-50%, 50%)' 
                                    }}
                                  >
                                    {lessonStats[lesson].total}
                                  </div>
                                  
                                  <div className="absolute w-full border-t-2 border-dashed border-slate-100 bottom-[50%] left-0 z-0"></div>
                                  <div className="absolute w-full border-t-2 border-dashed border-slate-100 bottom-[100%] left-0 z-0"></div>

                                  <span className="absolute -left-10 -bottom-3 text-xs font-bold text-slate-300">0</span>
                                  <span className="absolute -left-12 bottom-[50%] transform translate-y-1/2 text-xs font-bold text-slate-300">100</span>
                                  <span className="absolute -left-12 -top-3 text-xs font-bold text-slate-300">200+</span>
                                  <span className="absolute left-1/2 -bottom-8 text-xs text-slate-400 transform -translate-x-1/2 font-bold uppercase tracking-wider">Çözülen Soru</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-4 gap-2 text-center bg-slate-50 p-4 rounded-2xl border border-slate-200 mt-4">
                                <div>
                                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Soru</p>
                                  <p className="font-black text-slate-800 text-lg">{lessonStats[lesson].total}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] text-green-600 font-bold uppercase tracking-wider mb-1">Doğru</p>
                                  <p className="font-black text-green-700 text-lg">{lessonStats[lesson].correct}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] text-red-600 font-bold uppercase tracking-wider mb-1">Yanlış</p>
                                  <p className="font-black text-red-700 text-lg">{lessonStats[lesson].incorrect}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Boş</p>
                                  <p className="font-black text-slate-600 text-lg">{lessonStats[lesson].empty}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-100/50 p-10 rounded-3xl border border-dashed border-slate-300 text-center">
                        <p className="text-slate-500 font-medium">Bu tarihte hiç soru çözümü (nokta grafiği) kaydı bulunmuyor.</p>
                      </div>
                    )}

                    {/* --- BÖLÜM 2: DENEME SINAVLARI (TÜM ZAMANLAR) --- */}
                    <div className="border-t-4 border-slate-100 pt-16">
                      <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
                        <span className="text-3xl">🎯</span> Deneme Sınavları Gelişim Grafiği (Tüm Zamanlar)
                      </h3>
                      
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        
                        {/* TYT ÇUBUK GRAFİĞİ */}
                        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100">
                          <h4 className="font-bold text-xl text-slate-700 mb-10 text-center tracking-wide">TYT Gelişimi <span className="text-sm text-slate-400">(120 Soru)</span></h4>
                          
                          {tytDenemeler.length > 0 ? (
                            <>
                              <div className="flex items-end justify-center gap-6 h-64 border-b-4 border-slate-100 pb-2 relative">
                                {/* Hedef Çizgisi */}
                                <div className="absolute w-full border-t-2 border-dashed border-emerald-200 bottom-[83%] left-0 z-0"></div>
                                <span className="absolute -left-2 bottom-[83%] transform translate-y-1/2 text-xs font-bold text-emerald-400 bg-white pr-2">100 Net Hedefi</span>

                                {tytDenemeler.map((deneme, idx) => (
                                  <div key={idx} className="flex flex-col items-center group relative z-10">
                                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs font-bold py-2 px-3 rounded-xl whitespace-nowrap shadow-xl pointer-events-none">
                                      {deneme.date} <br/>
                                      <span className="text-emerald-400">{deneme.stats.net.toFixed(2)} Net</span>
                                    </div>
                                    <div 
                                      className="w-14 bg-gradient-to-t from-blue-600 to-indigo-400 rounded-t-xl transition-all duration-700 shadow-lg group-hover:from-blue-500 group-hover:to-indigo-300 cursor-pointer"
                                      style={{ height: `${Math.max((deneme.stats.net / 120) * 100, 5)}%` }}
                                    ></div>
                                    <span className="text-xs font-black text-slate-500 mt-3">{idx + 1}.</span>
                                  </div>
                                ))}
                              </div>

                              <div className="mt-10 space-y-3 max-h-60 overflow-y-auto pr-2">
                                {tytDenemeler.map((deneme, idx) => (
                                  <div key={idx} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors">
                                    <div className="flex items-center gap-4">
                                      <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black shadow-inner">{idx + 1}</span>
                                      <span className="text-sm font-bold text-slate-600">{deneme.date}</span>
                                    </div>
                                    <div className="flex items-center gap-5">
                                      <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded-md">{deneme.stats.correct} D</span>
                                      <span className="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded-md">{deneme.stats.incorrect} Y</span>
                                      <span className="text-base font-black text-indigo-700 w-20 text-right">{deneme.stats.net.toFixed(2)} Net</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="flex h-64 items-center justify-center text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                              Henüz çözülmüş TYT denemesi yok.
                            </div>
                          )}
                        </div>

                        {/* YDT ÇUBUK GRAFİĞİ */}
                        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100">
                          <h4 className="font-bold text-xl text-slate-700 mb-10 text-center tracking-wide">YDT Gelişimi <span className="text-sm text-slate-400">(80 Soru)</span></h4>
                          
                          {ydtDenemeler.length > 0 ? (
                            <>
                              <div className="flex items-end justify-center gap-6 h-64 border-b-4 border-slate-100 pb-2 relative">
                                <div className="absolute w-full border-t-2 border-dashed border-emerald-200 bottom-[87%] left-0 z-0"></div>
                                <span className="absolute -left-2 bottom-[87%] transform translate-y-1/2 text-xs font-bold text-emerald-400 bg-white pr-2">70 Net Hedefi</span>

                                {ydtDenemeler.map((deneme, idx) => (
                                  <div key={idx} className="flex flex-col items-center group relative z-10">
                                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs font-bold py-2 px-3 rounded-xl whitespace-nowrap shadow-xl pointer-events-none">
                                      {deneme.date} <br/>
                                      <span className="text-emerald-400">{deneme.stats.net.toFixed(2)} Net</span>
                                    </div>
                                    <div 
                                      className="w-14 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-xl transition-all duration-700 shadow-lg group-hover:from-emerald-400 group-hover:to-teal-300 cursor-pointer"
                                      style={{ height: `${Math.max((deneme.stats.net / 80) * 100, 5)}%` }}
                                    ></div>
                                    <span className="text-xs font-black text-slate-500 mt-3">{idx + 1}.</span>
                                  </div>
                                ))}
                              </div>

                              <div className="mt-10 space-y-3 max-h-60 overflow-y-auto pr-2">
                                {ydtDenemeler.map((deneme, idx) => (
                                  <div key={idx} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-teal-200 transition-colors">
                                    <div className="flex items-center gap-4">
                                      <span className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-black shadow-inner">{idx + 1}</span>
                                      <span className="text-sm font-bold text-slate-600">{deneme.date}</span>
                                    </div>
                                    <div className="flex items-center gap-5">
                                      <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded-md">{deneme.stats.correct} D</span>
                                      <span className="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded-md">{deneme.stats.incorrect} Y</span>
                                      <span className="text-base font-black text-teal-700 w-20 text-right">{deneme.stats.net.toFixed(2)} Net</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="flex h-64 items-center justify-center text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                              Henüz çözülmüş YDT denemesi yok.
                            </div>
                          )}
                        </div>

                      </div>
                    </div>

                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}