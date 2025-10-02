package com.calmic.photovault.worker

import android.app.Service
import android.content.Intent
import android.os.IBinder

class UploadWorkerService : Service() {
    override fun onBind(intent: Intent?): IBinder? = null
}
