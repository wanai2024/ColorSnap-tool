import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { cn, isDarkBackground } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';

interface ColorData {
  color: string;
  count: number;
  percentage: number;
}

interface ColorPaletteProps {
  colors: ColorData[];
}

export const ColorPalette = ({ colors }: ColorPaletteProps) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { theme } = useTheme();

  const handleCopyColor = async (color: string, index: number) => {
    try {
      await navigator.clipboard.writeText(color);
      setCopiedIndex(index);
      toast.success(`${color} 已复制到剪贴板！`);
      
      // 3秒后重置复制状态
      setTimeout(() => {
        setCopiedIndex(null);
      }, 3000);
    } catch (err) {
      toast.error('复制失败，请手动选择并复制');
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* 颜色比例图表 */}
      <div className={`mb-6 p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
        <h4 className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>颜色分布</h4>
        <div className="flex items-center h-4 rounded-full overflow-hidden">
          {colors.map((color, index) => (
            <div
              key={index}
              className="h-full"
              style={{
                backgroundColor: color.color,
                width: `${color.percentage}%`,
                position: 'relative'
              }}
              title={`${color.color} - ${color.percentage.toFixed(1)}%`}
            />
          ))}
        </div>
      </div>

      {/* 颜色块网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {colors.map((color, index) => {
          const isDark = isDarkBackground(color.color);
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn("rounded-xl overflow-hidden shadow-md", theme === 'dark' ? 'bg-gray-700/50' : 'bg-white')}
              whileHover={{ y: -5 }}
            >
              {/* 颜色块 */}
              <div 
                className="h-32 relative overflow-hidden"
                style={{ backgroundColor: color.color }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                
                {/* 百分比指示 */}
                <div className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-medium" style={{ 
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                  color: isDark ? 'white' : 'white'
                }}>
                  {color.percentage.toFixed(1)}%
                </div>
              </div>
              
              {/* 颜色信息 */}
              <div className="p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <div className={`font-mono text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>
                    {color.color}
                  </div>
                  <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                    出现 {color.count.toLocaleString()} 次
                  </div>
                </div>
                
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCopyColor(color.color, index)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                    copiedIndex === index 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : theme === 'dark' ? 'bg-gray-600 hover:bg-gray-500 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {copiedIndex === index ? (
                    <>
                      <i className="fa-solid fa-check mr-1"></i> 已复制
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-copy mr-1"></i> 复制
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* 调色板统计信息 */}
      <div className={`mt-6 p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
        <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          <p className="font-medium">统计信息</p>
          <ul className="mt-2 space-y-1">
            <li>总提取颜色: {colors.length} 种</li>
            <li>分析像素数: {colors.reduce((sum, color) => sum + color.count, 0).toLocaleString()}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};