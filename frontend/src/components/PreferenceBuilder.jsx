import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Plus, 
  Trash2, 
  GripVertical, 
  CheckCircle, 
  Loader2, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { jsPDF } from 'jspdf';

/**
 * CAP Round Preference Builder Component
 * A premium Glassmorphism-style builder for MHT-CET admissions.
 * Features: Two-column layout, Drag-and-Drop reordering, PDF generation.
 */

// --- Mock Data ---
const INITIAL_RECOMMENDED = [
  { id: '1', dteCode: '6006', name: 'COEP Technological University', branch: 'Computer Engineering', choiceCode: '600624510', probability: 'High' },
  { id: '2', dteCode: '3012', name: 'Veermata Jijabai Technological Institute (VJTI)', branch: 'Information Technology', choiceCode: '301224610', probability: 'High' },
  { id: '3', dteCode: '6271', name: 'Pune Institute of Computer Technology (PICT)', branch: 'Data Science', choiceCode: '627124510', probability: 'Medium' },
  { id: '4', dteCode: '3199', name: 'K. J. Somaiya College of Engineering', branch: 'Computer Science', choiceCode: '319924210', probability: 'Medium' },
  { id: '5', dteCode: '6273', name: 'Vishwakarma Institute of Technology (VIT)', branch: 'AI & ML', choiceCode: '627324510', probability: 'Low' },
];

const PreferenceBuilder = () => {
  const [recommended, setRecommended] = useState(INITIAL_RECOMMENDED);
  const [finalList, setFinalList] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // --- Handlers ---
  const addToFinal = (college) => {
    if (!finalList.find(c => c.id === college.id)) {
      setFinalList([...finalList, college]);
      setRecommended(recommended.filter(c => c.id !== college.id));
    }
  };

  const removeFromFinal = (college) => {
    setFinalList(finalList.filter(c => c.id !== college.id));
    setRecommended([...recommended, college]);
  };

  const generatePDF = () => {
    setIsGenerating(true);
    
    // Simulate generation delay
    setTimeout(() => {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      // 1. Header Background (Indigo)
      doc.setFillColor(79, 70, 229); // indigo-600
      doc.rect(0, 0, pageWidth, 40, 'F');

      // 2. Logo / App Name
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('EduPredict AI', 20, 20);

      // 3. Document Title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('CAP Round Preference List 2026', 20, 30);

      // 4. Metadata (Right Aligned)
      doc.setFontSize(10);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 60, 20);
      doc.text(`Total Selections: ${finalList.length}`, pageWidth - 60, 28);

      // 5. Table Section
      let y = 55;
      
      // Table Header Row
      doc.setFillColor(243, 244, 246); // gray-100
      doc.rect(15, y - 5, pageWidth - 30, 10, 'F');
      
      doc.setTextColor(55, 65, 81); // gray-700
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('PRIORITY', 20, y + 2);
      doc.text('DTE CODE', 45, y + 2);
      doc.text('COLLEGE & BRANCH', 75, y + 2);
      doc.text('CHOICE CODE', 165, y + 2);

      // Table Content
      doc.setFont('helvetica', 'normal');
      y += 15;

      finalList.forEach((item, index) => {
        // Page break logic
        if (y > pageHeight - 30) {
          doc.addPage();
          y = 20;
        }

        // Row background (alternating)
        if (index % 2 === 0) {
          doc.setFillColor(249, 250, 251); // gray-50
          doc.rect(15, y - 7, pageWidth - 30, 14, 'F');
        }

        // Draw Row Data
        doc.setTextColor(31, 41, 55); // gray-900
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}`, 22, y); // Priority Number
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(75, 85, 99); // gray-600
        doc.text(`${item.dteCode}`, 45, y);
        
        // Wrapped College Name & Branch
        doc.setTextColor(31, 41, 55);
        const collegeText = `${item.name}\n(${item.branch})`;
        doc.text(collegeText, 75, y, { maxWidth: 85 });
        
        doc.setTextColor(79, 70, 229); // Indigo for choice code
        doc.text(`${item.choiceCode}`, 165, y);

        y += 18; // Increase spacing for multi-line text
      });

      // 6. Footer
      doc.setTextColor(156, 163, 175); // gray-400
      doc.setFontSize(8);
      doc.text('Disclaimer: This is a generated preference list. Verify choice codes on the official portal before final submission.', 
        pageWidth / 2, pageHeight - 15, { align: 'center' });
      doc.text(`Page 1 of 1`, pageWidth - 30, pageHeight - 15);

      doc.save(`CollegePredict_Report_${new Date().getTime()}.pdf`);
      
      setIsGenerating(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-4 md:p-8 font-sans selection:bg-indigo-500/30">
      {/* Background Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40 mb-2">
              CAP Round Preference Builder
            </h1>
            <p className="text-gray-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Build your prioritized college list for MHT-CET Admissions
            </p>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={generatePDF}
            disabled={finalList.length === 0 || isGenerating}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all
              ${finalList.length === 0 
                ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] border border-indigo-400/30'}
            `}
          >
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            {isGenerating ? 'Generating PDF...' : 'Generate PDF'}
          </motion.button>
        </header>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Recommended */}
          <section className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold text-gray-200 px-1 text-shadow-glow">Recommended Colleges</h2>
              <span className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded-full text-gray-400">
                {recommended.length} Available
              </span>
            </div>
            
            <div className="space-y-4">
              <AnimatePresence mode='popLayout'>
                {recommended.map((college) => (
                  <CollegeCard 
                    key={college.id} 
                    college={college} 
                    type="recommended" 
                    onAction={() => addToFinal(college)} 
                  />
                ))}
              </AnimatePresence>
              {recommended.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="p-8 border-2 border-dashed border-white/5 rounded-2xl text-center text-gray-500"
                >
                  All recommended colleges added to your list.
                </motion.div>
              )}
            </div>
          </section>

          {/* Right Column: Final List */}
          <section className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold text-gray-200 px-1 text-shadow-glow">Final Allotment List</h2>
              <span className="text-xs bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-full text-indigo-400">
                {finalList.length} Selected
              </span>
            </div>

            <div className="glass rounded-3xl p-4 border border-white/10 bg-white/[0.02] backdrop-blur-xl min-h-[400px]">
              {finalList.length > 0 ? (
                <Reorder.Group 
                  axis="y" 
                  values={finalList} 
                  onReorder={setFinalList}
                  className="space-y-3"
                >
                  {finalList.map((college) => (
                    <Reorder.Item 
                      key={college.id} 
                      value={college}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <CollegeCard 
                        college={college} 
                        type="final" 
                        onAction={() => removeFromFinal(college)} 
                      />
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              ) : (
                <div className="h-[360px] flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/5">
                    <Plus className="w-8 h-8 text-gray-600" />
                  </div>
                  <h3 className="text-gray-300 font-medium mb-1">Your list is empty</h3>
                  <p className="text-gray-500 text-sm max-w-[200px]">
                    Add colleges from the recommendations to start building your list.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 bg-emerald-500/90 backdrop-blur-lg text-white rounded-2xl shadow-[0_10px_40px_rgba(16,185,129,0.4)] border border-emerald-400/30"
          >
            <CheckCircle className="w-6 h-6" />
            <span className="font-medium">Preference list saved and PDF downloaded!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .text-shadow-glow {
          text-shadow: 0 0 20px rgba(255,255,255,0.2);
        }
      `}</style>
    </div>
  );
};

// --- Sub-component: College Card ---
const CollegeCard = ({ college, type, onAction }) => {
  const isRecommended = type === 'recommended';

  const probColors = {
    High: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
    Medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]',
    Low: 'text-rose-400 bg-rose-400/10 border-rose-400/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2, backgroundColor: "rgba(255, 255, 255, 0.06)" }}
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300
        ${isRecommended 
          ? 'bg-white/[0.03] border-white/10 hover:border-indigo-500/30' 
          : 'bg-white/[0.05] border-white/10 shadow-lg'}
      `}
    >
      {/* Probability Glow (Only for recommended) */}
      {isRecommended && (
        <div className={`absolute top-0 left-0 w-1 h-full 
          ${college.probability === 'High' ? 'bg-emerald-500' : college.probability === 'Medium' ? 'bg-amber-500' : 'bg-rose-500'}`} 
        />
      )}

      <div className="p-5 flex items-start gap-4">
        {!isRecommended && (
          <div className="mt-1 text-gray-500 group-hover:text-gray-300 transition-colors">
            <GripVertical className="w-5 h-5" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase opacity-80">
              DTE: {college.dteCode}
            </span>
            {isRecommended && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border uppercase tracking-wider ${probColors[college.probability]}`}>
                {college.probability}
              </span>
            )}
          </div>
          
          <h3 className="text-base font-bold text-gray-100 truncate group-hover:text-white transition-colors">
            {college.name}
          </h3>
          
          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2">
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" />
              {college.branch}
            </p>
            <p className="text-xs text-gray-500 font-mono">
              Choice: <span className="text-gray-300">{college.choiceCode}</span>
            </p>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onAction();
          }}
          className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-xl transition-all
            ${isRecommended 
              ? 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white border border-indigo-500/20' 
              : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20'}
          `}
        >
          {isRecommended ? <Plus className="w-5 h-5" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Decorative inner glow */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
};

export default PreferenceBuilder;
