import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { extractColors } from '@/lib/colorExtractor';
import { ColorPalette } from '@/components/ColorPalette';
import { ImageUploader } from '@/components/ImageUploader';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface ExtractedColor {
  color: string;
  count: number;
  percentage: number;
}

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [colors, setColors] = useState<ExtractedColor[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useTheme();

  const handleImageUpload = (file: File) => {
    // 验证文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('请上传支持的图片格式（JPG, PNG, GIF, WebP）');
      toast.error('不支持的图片格式');
      return;
    }

    // 验证文件大小（10MB限制）
    if (file.size > 10 * 1024 * 1024) {
      setError('图片大小不能超过10MB');
      toast.error('图片过大，请上传小于10MB的图片');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setColors([]);

    // 读取图片并处理
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const imageData = e.target?.result as string;
        setImage(imageData);
        
        // 提取颜色
        const extractedColors = await extractColors(imageData, 6);
        setColors(extractedColors);
        
        toast.success('颜色提取成功！');
      } catch (err) {
        setError('处理图片时出错，请重试');
        toast.error('处理图片时出错');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setError('读取图片时出错，请重试');
      toast.error('读取图片时出错');
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadPalette = () => {
    if (colors.length === 0) {
      toast.warning('没有可下载的调色盘');
      return;
    }

    // 创建一个简单的HTML页面用于下载
    let paletteHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>提取的调色盘</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .palette { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
            .color-block { width: 100px; height: 100px; border-radius: 8px; }
            .color-info { margin-top: 5px; text-align: center; font-size: 14px; }
          </style>
        </head>
        <body>
          <h1>提取的调色盘</h1>
          <div class="palette">
            ${colors.map(color => `
              <div>
                <div class="color-block" style="background-color: ${color.color};"></div>
                <div class="color-info">${color.color}</div>
                <div class="color-info">${color.percentage.toFixed(1)}%</div>
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([paletteHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted-palette.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('调色盘已下载');
  };

  return (
    <div className={cn("min-h-screen flex flex-col", theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900')}>
      {/* 导航栏 */}
      <header className={cn("sticky top-0 z-50 backdrop-blur-md bg-opacity-80", theme === 'dark' ? 'bg-gray-900' : 'bg-white', "border-b", theme === 'dark' ? 'border-gray-700' : 'border-gray-200')}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <i className="fa-solid fa-palette text-white text-xl"></i>
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">ColorSnap</h1>
          </motion.div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme} 
              className={cn("w-10 h-10 rounded-full flex items-center justify-center", theme === 'dark' ? 'bg-gray-800 text-yellow-400' : 'bg-gray-200 text-gray-800')}
            >
              <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-3">在线图片颜色提取工具</h2>
          <p className={cn("text-lg max-w-2xl mx-auto", theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
            上传图片，自动提取主要颜色，生成专业调色盘，轻松复制HEX色号
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* 左侧：图片上传和预览 */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={cn("rounded-2xl overflow-hidden shadow-lg", theme === 'dark' ? 'bg-gray-800' : 'bg-white')}
          >
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <i className="fa-solid fa-image"></i> 图片上传
              </h3>
              
              {!image ? (
                <ImageUploader 
                  onImageUpload={handleImageUpload} 
                  isProcessing={isProcessing}
                  error={error}
                />
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="relative"
                >
                  <div className="rounded-xl overflow-hidden border-2 border-dashed border-gray-300">
                    <img 
                      src={image} 
                      alt="预览图片" 
                      className="w-full h-auto object-contain max-h-[300px]"
                    />
                  </div>
                  
                  <div className="flex justify-between mt-4">
                    <button 
                      onClick={() => {
                        setImage(null);
                        setColors([]);
                      }}
                      className={cn("px-4 py-2 rounded-lg", theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300')}
                    >
                      <i className="fa-solid fa-undo mr-2"></i>重新上传
                    </button>
                    
                    {colors.length > 0 && (
                      <button 
                        onClick={handleDownloadPalette}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90"
                      >
                        <i className="fa-solid fa-download mr-2"></i>下载调色盘
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* 右侧：调色盘显示 */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className={cn("rounded-2xl shadow-lg", theme === 'dark' ? 'bg-gray-800' : 'bg-white')}
          >
            <div className="p-6 h-full flex flex-col">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <i className="fa-solid fa-palette"></i> 提取的颜色
              </h3>
              
              {isProcessing ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 border-4 border-t-indigo-500 border-gray-300 rounded-full animate-spin"></div>
                  <p className={cn("mt-4", theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>正在分析图片...</p>
                </div>
              ) : colors.length > 0 ? (
                <ColorPalette colors={colors} />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mb-4", theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200')}>
                    <i className={cn("fa-solid fa-magic text-3xl", theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}></i>
                  </div>
                  <p className={cn("mb-2", theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>上传图片后，我们将自动提取其中的主要颜色</p>
                  <p className={cn("text-sm", theme === 'dark' ? 'text-gray-500' : 'text-gray-500')}>支持JPG、PNG、GIF和WebP格式</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* 使用提示 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`mt-12 p-6 rounded-xl max-w-3xl mx-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}
        >
          <h3 className="text-xl font-semibold mb-3">使用提示</h3>
          <ul className={`space-y-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            <li className="flex items-start gap-2">
              <i className="fa-solid fa-check-circle text-green-500 mt-1"></i>
              <span>上传高质量图片以获得更准确的颜色提取结果</span>
            </li>
            <li className="flex items-start gap-2">
              <i className="fa-solid fa-check-circle text-green-500 mt-1"></i>
              <span>点击颜色块下方的复制按钮，即可将HEX色号复制到剪贴板</span>
            </li>
            <li className="flex items-start gap-2">
              <i className="fa-solid fa-check-circle text-green-500 mt-1"></i>
              <span>提取的颜色按照在图片中出现的频率排序</span>
            </li>
          </ul>
        </motion.div>
      </main>

      {/* 页脚 */}
      <footer className={cn("py-6 border-t", theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white')}>
        <div className="container mx-auto px-4 text-center">
          <p className={cn("text-sm", theme === 'dark' ? 'text-gray-500' : 'text-gray-600')}>
            © 2025 ColorSnap - 在线图片颜色提取工具 | 设计与开发
          </p>
        </div>
      </footer>
    </div>
  );
}