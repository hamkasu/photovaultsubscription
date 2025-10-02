package com.calmic.photovault.ui.camera

import android.content.Context
import android.graphics.*
import android.util.AttributeSet
import android.view.View

class EdgeOverlayView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {
    
    private val paint = Paint().apply {
        color = Color.GREEN
        strokeWidth = 4f
        style = Paint.Style.STROKE
        isAntiAlias = true
    }
    
    private val pointPaint = Paint().apply {
        color = Color.GREEN
        strokeWidth = 12f
        style = Paint.Style.FILL
        isAntiAlias = true
    }
    
    private var detectedCorners: List<Point>? = null
    
    fun drawDetectedEdges(corners: List<Point>) {
        detectedCorners = corners
        invalidate()
    }
    
    fun clearEdges() {
        detectedCorners = null
        invalidate()
    }
    
    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        
        detectedCorners?.let { corners ->
            if (corners.size == 4) {
                // Draw lines connecting corners
                val path = Path()
                path.moveTo(corners[0].x.toFloat(), corners[0].y.toFloat())
                for (i in 1..3) {
                    path.lineTo(corners[i].x.toFloat(), corners[i].y.toFloat())
                }
                path.close()
                
                canvas.drawPath(path, paint)
                
                // Draw corner points
                corners.forEach { corner ->
                    canvas.drawCircle(
                        corner.x.toFloat(),
                        corner.y.toFloat(),
                        8f,
                        pointPaint
                    )
                }
            }
        }
    }
}
