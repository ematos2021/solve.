package br.com.solve.central;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Plugins próprios precisam ser registrados ANTES do super.onCreate,
        // senão a ponte JS já subiu sem eles.
        registerPlugin(SolvePrinterPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
