import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  isProcessing: boolean;
  error: string | null;
}

export const ImageUploader = ({ onImageUpload, isProcessing, error }: ImageUploaderProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { theme } = useTheme();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
      // 重置input，以便可以重复选择同一文件
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 hover:scale-[1.01]",
          theme === 'dark' ? 'border-gray-700' : 'border-gray-300',
          isDragging 
            ? theme === 'dark' ? 'border-indigo-500 bg-indigo-900/20' : 'border-indigo-500 bg-indigo-50' 
            : theme === 'dark' ? 'hover:border-gray-600' : 'hover:border-gray-400'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
          disabled={isProcessing}
        />
        
        <div className={`mx-auto w-16 h-16 rounded-full mb-4 flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
          {isProcessing ? (
            <div className="w-8 h-8 border-4 border-t-indigo-500 border-gray-300 rounded-full animate-spin"></div>
          ) : (
            <i className={`fa-solid fa-cloud-arrow-up text-2xl ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}></i>
          )}
        </div>
        
        <h4 className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>
          {isProcessing ? '正在上传...' : '拖拽图片到此处或点击上传'}
        </h4>
        
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
          支持 JPG, PNG, GIF, WebP 等格式，最大 10MB
        </p>
        
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-red-500 text-sm flex items-center justify-center gap-1"
          >
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{error}</span>
          </motion.div>
        )}
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={isProcessing}
          className={`mt-4 px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium transition-opacity ${isProcessing ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'}`}
          onClick={(e) => {
            e.stopPropagation();
            if (inputRef.current) {
              inputRef.current.click();
            }
          }}
        >
          {isProcessing ? (
            <>
              <i className="fa-solid fa-spinner fa-spin mr-2"></i>
              处理中...
            </>
          ) : (
            <>
              <i className="fa-solid fa-folder-open mr-2"></i>
              选择图片
            </>
          )}
        </motion.button>
      </motion.div>
      
      {/* 装饰元素 */}
      <motion.div 
        className="absolute -z-10 w-full h-full top-1 left-1 rounded-xl opacity-30"
        animate={isDragging ? { scale: 1.02 } : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
        style={{
          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
          filter: 'blur(10px)'
        }}
      />
    </div>
  );
};