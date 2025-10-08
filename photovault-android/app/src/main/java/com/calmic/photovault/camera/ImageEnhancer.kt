package com.calmic.photovault.camera

import android.graphics.Bitmap
import android.graphics.Point
import com.calmic.photovault.data.model.EnhancementSettings
import org.opencv.android.Utils
import org.opencv.core.*
import org.opencv.imgproc.Imgproc
import org.opencv.photo.Photo

class ImageEnhancer {
    
    fun enhancePhoto(
        bitmap: Bitmap,
        settings: EnhancementSettings,
        corners: List<Point>? = null
    ): Bitmap {
        var mat = Mat()
        Utils.bitmapToMat(bitmap, mat)
        
        // Apply perspective correction if corners provided
        if (corners != null && corners.size == 4 && settings.perspectiveCorrection) {
            mat = applyPerspectiveCorrection(mat, corners)
        }
        
        // Auto color correction
        if (settings.autoCorrect) {
            mat = autoColorCorrect(mat)
        }
        
        // Denoise
        if (settings.denoise) {
            val denoised = Mat()
            Photo.fastNlMeansDenoisingColored(mat, denoised, 10f, 10f, 7, 21)
            mat.release()
            mat = denoised
        }
        
        // Adjust brightness and contrast
        if (settings.brightness != 1.0f || settings.contrast != 1.0f) {
            mat = adjustBrightnessContrast(mat, settings.brightness, settings.contrast)
        }
        
        // Adjust saturation
        if (settings.saturation != 1.0f) {
            mat = adjustSaturation(mat, settings.saturation)
        }
        
        // Sharpen
        if (settings.sharpen) {
            mat = sharpenImage(mat)
        }
        
        // Convert back to bitmap
        val result = Bitmap.createBitmap(mat.cols(), mat.rows(), Bitmap.Config.ARGB_8888)
        Utils.matToBitmap(mat, result)
        mat.release()
        
        return result
    }
    
    private fun applyPerspectiveCorrection(mat: Mat, corners: List<Point>): Mat {
        // Define source points (detected corners)
        val srcPoints = MatOfPoint2f()
        srcPoints.fromArray(
            *corners.map { org.opencv.core.Point(it.x.toDouble(), it.y.toDouble()) }.toTypedArray()
        )
        
        // Calculate target dimensions
        val width1 = distance(corners[0], corners[1])
        val width2 = distance(corners[2], corners[3])
        val maxWidth = maxOf(width1, width2).toInt()
        
        val height1 = distance(corners[0], corners[3])
        val height2 = distance(corners[1], corners[2])
        val maxHeight = maxOf(height1, height2).toInt()
        
        // Define destination points (rectangle)
        val dstPoints = MatOfPoint2f()
        dstPoints.fromArray(
            org.opencv.core.Point(0.0, 0.0),
            org.opencv.core.Point(maxWidth.toDouble(), 0.0),
            org.opencv.core.Point(maxWidth.toDouble(), maxHeight.toDouble()),
            org.opencv.core.Point(0.0, maxHeight.toDouble())
        )
        
        // Get perspective transformation matrix
        val transformMatrix = Imgproc.getPerspectiveTransform(srcPoints, dstPoints)
        
        // Apply perspective warp
        val warped = Mat()
        Imgproc.warpPerspective(
            mat, warped, transformMatrix,
            Size(maxWidth.toDouble(), maxHeight.toDouble())
        )
        
        mat.release()
        return warped
    }
    
    private fun autoColorCorrect(mat: Mat): Mat {
        // Convert to LAB color space
        val lab = Mat()
        Imgproc.cvtColor(mat, lab, Imgproc.COLOR_RGB2Lab)
        
        // Split channels
        val channels = ArrayList<Mat>()
        Core.split(lab, channels)
        
        // Apply CLAHE to L channel
        val clahe = Imgproc.createCLAHE(2.0, Size(8.0, 8.0))
        clahe.apply(channels[0], channels[0])
        
        // Merge channels
        Core.merge(channels, lab)
        
        // Convert back to RGB
        val result = Mat()
        Imgproc.cvtColor(lab, result, Imgproc.COLOR_Lab2RGB)
        
        lab.release()
        channels.forEach { it.release() }
        
        return result
    }
    
    private fun adjustBrightnessContrast(mat: Mat, brightness: Float, contrast: Float): Mat {
        val result = Mat()
        mat.convertTo(result, -1, contrast.toDouble(), (brightness - 1.0) * 255.0)
        return result
    }
    
    private fun adjustSaturation(mat: Mat, saturation: Float): Mat {
        val hsv = Mat()
        Imgproc.cvtColor(mat, hsv, Imgproc.COLOR_RGB2HSV)
        
        val channels = ArrayList<Mat>()
        Core.split(hsv, channels)
        
        // Adjust saturation channel
        channels[1].convertTo(channels[1], -1, saturation.toDouble(), 0.0)
        
        Core.merge(channels, hsv)
        
        val result = Mat()
        Imgproc.cvtColor(hsv, result, Imgproc.COLOR_HSV2RGB)
        
        hsv.release()
        channels.forEach { it.release() }
        
        return result
    }
    
    private fun sharpenImage(mat: Mat): Mat {
        val kernel = Mat(3, 3, CvType.CV_32F)
        kernel.put(0, 0,
            0.0, -1.0, 0.0,
            -1.0, 5.0, -1.0,
            0.0, -1.0, 0.0
        )
        
        val result = Mat()
        Imgproc.filter2D(mat, result, -1, kernel)
        
        kernel.release()
        return result
    }
    
    private fun distance(p1: Point, p2: Point): Double {
        val dx = (p1.x - p2.x).toDouble()
        val dy = (p1.y - p2.y).toDouble()
        return kotlin.math.sqrt(dx * dx + dy * dy)
    }
}
