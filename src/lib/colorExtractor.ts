import { createCanvas, rgbToHex } from './utils';

// 颜色数据接口
export interface ColorData {
  color: string;
  count: number;
  percentage: number;
}

// RGB颜色接口
interface RGBColor {
  r: number;
  g: number;
  b: number;
}

// K-means聚类算法的点接口
interface Point {
  r: number;
  g: number;
  b: number;
  cluster: number;
  distance: number;
}

// K-means聚类算法实现
function kMeans(points: Point[], k: number, maxIterations: number = 100): RGBColor[] {
  // 初始化聚类中心
  const centroids: RGBColor[] = [];
  
  // 使用k-means++算法初始化聚类中心，避免不良初始值
  if (points.length > 0) {
    // 随机选择第一个中心点
    const firstIndex = Math.floor(Math.random() * points.length);
    centroids.push({
      r: points[firstIndex].r,
      g: points[firstIndex].g,
      b: points[firstIndex].b
    });
    
    // 选择剩余的中心点
    for (let i = 1; i < k && i < points.length; i++) {
      // 计算每个点到最近中心点的距离的平方
      const distances: number[] = points.map(point => {
        let minDistance = Infinity;
        for (const centroid of centroids) {
          const distance = Math.pow(point.r - centroid.r, 2) +
                          Math.pow(point.g - centroid.g, 2) +
                          Math.pow(point.b - centroid.b, 2);
          minDistance = Math.min(minDistance, distance);
        }
        return minDistance;
      });
      
      // 计算总距离
      const totalDistance = distances.reduce((sum, d) => sum + d, 0);
      
      // 根据概率选择下一个中心点
      let randomValue = Math.random() * totalDistance;
      let selectedIndex = 0;
      
      for (let j = 0; j < distances.length; j++) {
        randomValue -= distances[j];
        if (randomValue <= 0) {
          selectedIndex = j;
          break;
        }
      }
      
      centroids.push({
        r: points[selectedIndex].r,
        g: points[selectedIndex].g,
        b: points[selectedIndex].b
      });
    }
  }
  
  // 迭代更新聚类中心
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // 分配每个点到最近的聚类中心
    let hasChanged = false;
    
    for (const point of points) {
      let minDistance = Infinity;
      let newCluster = 0;
      
      for (let i = 0; i < centroids.length; i++) {
        const distance = Math.pow(point.r - centroids[i].r, 2) +
                        Math.pow(point.g - centroids[i].g, 2) +
                        Math.pow(point.b - centroids[i].b, 2);
        
        if (distance < minDistance) {
          minDistance = distance;
          newCluster = i;
        }
      }
      
      if (point.cluster !== newCluster) {
        point.cluster = newCluster;
        hasChanged = true;
      }
      
      point.distance = minDistance;
    }
    
    // 如果没有点改变聚类，则收敛
    if (!hasChanged) {
      break;
    }
    
    // 计算新的聚类中心
    const newCentroids: RGBColor[] = centroids.map(() => ({ r: 0, g: 0, b: 0 }));
    const counts: number[] = new Array(centroids.length).fill(0);
    
    for (const point of points) {
      newCentroids[point.cluster].r += point.r;
      newCentroids[point.cluster].g += point.g;
      newCentroids[point.cluster].b += point.b;
      counts[point.cluster]++;
    }
    
    // 计算平均值
    for (let i = 0; i < centroids.length; i++) {
      if (counts[i] > 0) {
        centroids[i].r = newCentroids[i].r / counts[i];
        centroids[i].g = newCentroids[i].g / counts[i];
        centroids[i].b = newCentroids[i].b / counts[i];
      }
    }
  }
  
  return centroids;
}

// 从图片中提取颜色的主函数
export async function extractColors(imageDataUrl: string, colorCount: number = 6): Promise<ColorData[]> {
  return new Promise((resolve, reject) => {
    try {
      // 创建图片对象
      const img = new Image();
      
      // 处理跨域问题
      img.crossOrigin = 'anonymous';
      
      img.onload = function() {
        try {
          // 确定图片的处理尺寸（缩小大图片以提高性能）
          const maxDimension = 200;
          let width = img.width;
          let height = img.height;
          
          if (width > height && width > maxDimension) {
            height = Math.floor(height * (maxDimension / width));
            width = maxDimension;
          } else if (height > maxDimension) {
            width = Math.floor(width * (maxDimension / height));
            height = maxDimension;
          }
          
          // 创建canvas并绘制图片
          const canvas = createCanvas(width, height);
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('无法创建canvas上下文'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // 获取图片数据
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          
          // 提取所有像素的颜色
          const points: Point[] = [];
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            // 跳过透明或接近透明的像素
            if (a < 128) {
              continue;
            }
            
            points.push({
              r,
              g,
              b,
              cluster: 0,
              distance: 0
            });
          }
          
          // 如果没有足够的像素点，返回默认颜色
          if (points.length === 0) {
            resolve([
              { color: '#FFFFFF', count: 1, percentage: 100 }
            ]);
            return;
          }
          
          // 调整k值，确保不超过点的数量
          const k = Math.min(colorCount, points.length);
          
          // 使用k-means聚类算法提取主要颜色
          const centroids = kMeans(points, k);
          
          // 计算每个聚类的像素数量和百分比
          const clusterCounts = new Array(k).fill(0);
          
          for (const point of points) {
            clusterCounts[point.cluster]++;
          }
          
          const totalPixels = points.length;
          
          // 生成结果
          const colors: ColorData[] = centroids
            .map((centroid, index) => ({
              color: rgbToHex(centroid.r, centroid.g, centroid.b),
              count: clusterCounts[index],
              percentage: (clusterCounts[index] / totalPixels) * 100
            }))
            .filter(color => color.count > 0) // 过滤掉没有像素的颜色
            .sort((a, b) => b.count - a.count); // 按出现频率排序
          
          resolve(colors);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = function() {
        reject(new Error('无法加载图片'));
      };
      
      // 设置图片源
      img.src = imageDataUrl;
    } catch (error) {
      reject(error);
    }
  });
}