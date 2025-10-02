package com.calmic.photovault.camera

import android.graphics.Bitmap
import android.graphics.Point
import org.opencv.android.Utils
import org.opencv.core.*
import org.opencv.imgproc.Imgproc
import kotlin.math.sqrt

class EdgeDetector {
    
    data class DetectedPhoto(
        val corners: List<Point>,
        val confidence: Float
    )
    
    fun detectPhotoEdges(bitmap: Bitmap): DetectedPhoto? {
        try {
            // Convert bitmap to OpenCV Mat
            val mat = Mat()
            Utils.bitmapToMat(bitmap, mat)
            
            // Resize for faster processing
            val resized = Mat()
            val scale = 600.0 / mat.width()
            Imgproc.resize(mat, resized, Size(), scale, scale, Imgproc.INTER_AREA)
            
            // Convert to grayscale
            val gray = Mat()
            Imgproc.cvtColor(resized, gray, Imgproc.COLOR_RGB2GRAY)
            
            // Apply Gaussian blur
            Imgproc.GaussianBlur(gray, gray, Size(5.0, 5.0), 0.0)
            
            // Edge detection using Canny
            val edges = Mat()
            Imgproc.Canny(gray, edges, 50.0, 150.0)
            
            // Dilate edges
            val kernel = Imgproc.getStructuringElement(Imgproc.MORPH_RECT, Size(3.0, 3.0))
            Imgproc.dilate(edges, edges, kernel)
            
            // Find contours
            val contours = ArrayList<MatOfPoint>()
            val hierarchy = Mat()
            Imgproc.findContours(edges, contours, hierarchy, Imgproc.RETR_EXTERNAL, Imgproc.CHAIN_APPROX_SIMPLE)
            
            // Find the largest contour
            if (contours.isEmpty()) return null
            
            var maxArea = 0.0
            var maxContour: MatOfPoint? = null
            
            for (contour in contours) {
                val area = Imgproc.contourArea(contour)
                if (area > maxArea) {
                    maxArea = area
                    maxContour = contour
                }
            }
            
            if (maxContour == null || maxArea < 1000) return null
            
            // Approximate polygon
            val contour2f = MatOfPoint2f(*maxContour.toArray())
            val approx = MatOfPoint2f()
            val peri = Imgproc.arcLength(contour2f, true)
            Imgproc.approxPolyDP(contour2f, approx, 0.02 * peri, true)
            
            // Convert to points
            val points = approx.toArray()
            
            // We expect 4 corners for a rectangle
            if (points.size == 4) {
                // Scale points back to original size
                val corners = points.map { p ->
                    Point(
                        (p.x / scale).toInt(),
                        (p.y / scale).toInt()
                    )
                }
                
                // Order corners: top-left, top-right, bottom-right, bottom-left
                val orderedCorners = orderCorners(corners)
                
                // Calculate confidence based on how rectangular it is
                val confidence = calculateRectangleConfidence(orderedCorners)
                
                // Clean up
                mat.release()
                resized.release()
                gray.release()
                edges.release()
                
                return DetectedPhoto(orderedCorners, confidence)
            }
            
            // Clean up
            mat.release()
            resized.release()
            gray.release()
            edges.release()
            
            return null
            
        } catch (e: Exception) {
            e.printStackTrace()
            return null
        }
    }
    
    private fun orderCorners(corners: List<Point>): List<Point> {
        // Order points: top-left, top-right, bottom-right, bottom-left
        val sorted = corners.sortedBy { it.x + it.y }
        
        val topLeft = sorted[0]
        val bottomRight = sorted[3]
        
        val remaining = sorted.subList(1, 3)
        val topRight: Point
        val bottomLeft: Point
        
        if (remaining[0].y < remaining[1].y) {
            topRight = remaining[0]
            bottomLeft = remaining[1]
        } else {
            topRight = remaining[1]
            bottomLeft = remaining[0]
        }
        
        return listOf(topLeft, topRight, bottomRight, bottomLeft)
    }
    
    private fun calculateRectangleConfidence(corners: List<Point>): Float {
        if (corners.size != 4) return 0f
        
        // Calculate side lengths
        val width1 = distance(corners[0], corners[1])
        val width2 = distance(corners[2], corners[3])
        val height1 = distance(corners[0], corners[3])
        val height2 = distance(corners[1], corners[2])
        
        // Calculate aspect ratio similarity
        val widthRatio = minOf(width1, width2) / maxOf(width1, width2)
        val heightRatio = minOf(height1, height2) / maxOf(height1, height2)
        
        // Average similarity
        return ((widthRatio + heightRatio) / 2).toFloat()
    }
    
    private fun distance(p1: Point, p2: Point): Double {
        val dx = (p1.x - p2.x).toDouble()
        val dy = (p1.y - p2.y).toDouble()
        return sqrt(dx * dx + dy * dy)
    }
}
