[English](README.md) | [中文](docs/README_ZH.md)

# OFBiz Drools Plugin

OFBiz Drools Plugin integrates [kie drools workbench](https://github.com/kiegroup/kie-wb-distributions) and [kie server](https://github.com/kiegroup/droolsjbpm-integration) into [OFBiz](https://github.com/apache/ofbiz).

This plugin is developed for [SandFlower project](https://github.com/SandFlower/) to make it an OOTB IOT/RFID product for small business end users to help them design/test/deploy differential prices or commissions, or duty work schedule and etc.

In short word, this plugin is a rule calculator.

<br/>

### License
Apache License V2.0

<br/>

### Contribution
Welcome any kind of contribution to this plugin.

<br/>

### Quick Start

**1. Checkout OFBiz 16.11.07 from http://svn.apache.org/repos/asf/ofbiz/tags/REL-16.11.07**

<br/>

**2. Apply patches under patches/ofbiz to OFBiz**

<br/>

**3. Download this plugin**

<br/>

**4. Deploy this plugin in hot-deploy/drools/**

<br/>

**5. Download gradle 4.9 and install. If you use gradlew, please edit gradle/wrapper/gradle-wrapper.properties, change to use gradle 4.9:**

```
distributionUrl=https\://services.gradle.org/distributions/gradle-4.9-bin.zip
```

<br/>

**6. Install OFBiz seed data by command: **

```
gradle loadDefault
```

<br/>

**7. Start OFBiz by command:**

```
gradle ofbiz
```

<br/>

**8. In browser, visit http://localhost:8080/kie-server/services/rest/server**

Username: kieserver

Password: sandflower

After login successfully, you can see kie server information.

![kie server](docs/images/sandflower-kie-server.png)

<br/>

**9. In browser, visit https://localhost:8443/drools-wb/**

Username: admin

Password: ofbiz

After login successfully, you can use drools workbench now.

<br/>

**10. Import a sample in Design, i.e. Mortgages and deploy it.**

<br/>

**11. Add a kie-server named runtime/drools/ofbiz-kie-server in Deploy:**

![kie controller](docs/images/sandflower-kie-drools-wb-deploy.png)

<br/>

**12. Verify any container is running by visiting http://localhost:8080/kie-server/services/rest/server/containers:**

![kie server containers](docs/images/sandflower-kie-server-containers.png)

and check a specific container status, i.e. mortgages:mortgages:1.0.0-SNAPSHOT, by http://localhost:8080/kie-server/services/rest/server/containers/mortgages:mortgages:1.0.0-SNAPSHOT:

![kie server container](docs/images/sandflower-kie-server-container.png)

<br/>

**13. Call rules in a kie-server container in postman:**

13.1. Set Auth to Basic Auth, Username: kieserver, Password: sandflower

![call rules in kie server: set Auth](docs/images/sandflower-kie-server-container-postman-Authorization.png)

<br/>

13.2. Set Headers with Content-Type: application/json, X-KIE-ContentType: JSON, Accept: application/json

![call rules in kie server: set Headers](docs/images/sandflower-kie-server-container-postman-Headers.png)

<br/>

13.3. Set Body in the post:

![call rules in kie server: set Body](docs/images/sandflower-kie-server-container-postman-Body.png)

<br/>

13.4. Send the post request and get rule result

![call rules in kie server: Result](docs/images/sandflower-kie-server-container-postman-Result.png)

<br/>

### Development Notes

**1. How to build webapp/drools-wb-7.11.0.Final for this plugin**

1.1. Apply kie/kie-drools-wb-distribution-wars-7.11.0.Final.patch to [kie-wb-distributions/kie-drools-wb-parent/kie-drools-wb-distribution-wars/](https://github.com/kiegroup/kie-wb-distributions/tree/7.11.0.Final/kie-drools-wb-parent/kie-drools-wb-distribution-wars)

![apply patch to kie-drools-wb-distribution-wars](docs/images/sandflower-kie-drools-wb-distribution-wars-patch.png)

<br/>

1.2. Run mvn clean package to build target/kie-drools-wb-7.11.0.Final-ofbiz, it's the webapp/drools-wb-7.11.0.Final

![build kie-drools-wb-7.11.0.Final-ofbiz](docs/images/sandflower-kie-drools-wb-distribution-wars-package.png)

<br/>

**2. How to build webapp/kie-server-7.11.0.Final for this plugin**

2.1. Apply kie/kie-server-7.11.0.Final.patch to [droolsjbpm-integration/kie-server-parent/kie-server-wars/kie-server/](https://github.com/kiegroup/droolsjbpm-integration/tree/7.11.0.Final/kie-server-parent/kie-server-wars/kie-server)

![apply patch to kie-server](docs/images/sandflower-kie-server-patch.png)

<br/>

2.2. Run mvn clean package to build target/kie-server-7.11.0.Final-ofbiz, it's the webapp/kie-server-7.11.0.Final

![build kie-server-7.11.0.Final-ofbiz](docs/images/sandflower-kie-server-package.png)

<br/>

**3. Why apply patches/ofbiz/startup-with-webapp-context.xml.patch**

As you see, when deploying kie-drools-wb or kie-server in tomcat, the META-INF/context.xml is applied. In OFBiz 16.11.07, it's not. With patches/ofbiz/startup-with-webapp-context.xml.patch, META-INF/context.xml is configured, and then authz and taglibs can work as expected:

```java
        String contextXmlFilePath = new StringBuilder().append("file:///").append(location).append("/").append(Constants.ApplicationContextXml).toString();
        URL contextXmlUrl = null;
        try {
            contextXmlUrl = FlexibleLocation.resolveLocation(contextXmlFilePath);
            contextXmlFilePath = new StringBuilder().append(location).append("/").append(Constants.ApplicationContextXml).toString();
            File contextXmlFile = FileUtil.getFile(contextXmlFilePath);
            if (contextXmlFile.exists() && contextXmlFile.isFile()) { 
                Debug.logInfo(contextXmlFilePath + " found and will be loaded.", module);
                context.setConfigFile(contextXmlUrl);
            } else {
                // Debug.logInfo(contextXmlFilePath + " not found or not a file.", module);
            }
        } catch (MalformedURLException e) {
            Debug.logInfo(contextXmlFilePath+ " not found.", module);
        }
        
        Tomcat.initWebappDefaults(context);
```

context.setConfigFile(contextXmlUrl) is the core line.

<br/>

**4. Why apply patches/ofbiz/build.gradle.patch**

In this patch, 2 functions are added, one is exposing rootProject.jvmArguments to make build.gradle of a component extend and change them:

```groovy
-List jvmArguments = ['-Xms128M', '-Xmx1024M']
+ext.jvmArguments = ['-Xms128M', '-Xmx2048M']
```

and then in the build.gradle of OFBiz-Drools plugin, the rootProject.jvmArguments are extended:

```groovy
rootProject.jvmArguments.each { jvmArg ->
    if (jvmArg && jvmArg.startsWith("-Dlog4j.configurationFile=")) {
        originalLog4jConfig = jvmArg
        if (!jvmArg.endsWith("=")) {
            jvmArg += ","
        }
        log4jConfig = jvmArg + "hot-deploy/drools/config/log4j2-drools.xml"
        findLogArg = true
        return true
    }
}
if (!findLogArg) {
    rootProject.jvmArguments.add('-Dlog4j.configurationFile=log4j2.xml,hot-deploy/drools/config/log4j2-drools.xml')
} else {
    rootProject.jvmArguments.remove(originalLog4jConfig)
    rootProject.jvmArguments.add(log4jConfig)
}

...
rootProject.jvmArguments.add('-Dorg.uberfire.nio.git.dir=runtime/drools')
...
```

Another function is adding pluginLibsCompileOnly as the lastest OFBiz:

```groovy
+        //compile-only libraries
+        pluginLibsCompileOnly
...
+        compileOnly project(path: subProject.path, configuration: 'pluginLibsCompileOnly')
```

and then in the build.gradle of OFBiz-Drools plugin, the pluginLibsCompileOnly can be used:

```groovy
    pluginLibsCompileOnly 'org.jbpm:jbpm-wb-dashboard-client:' + droolsVersion
```

<br/>

**5. Why apply patches/ofbiz/cookie-name-slash.patch**

There's a test case to add a prefix to /drools-wb and /kie-server in ofbiz-component.xml, for example:

```
        mount-point="/sandflower/demo/trunk/kie-server"
```

The patches/ofbiz/cookie-name-slash.patch is to fix an error message on the auto login cookie in web brower:

```java
     protected static String getAutoLoginCookieName(HttpServletRequest request) {
-        return UtilHttp.getApplicationName(request) + ".autoUserLoginId";
+        return UtilHttp.getApplicationName(request).replaceAll("/", ".") + ".autoUserLoginId";
     }
```

<br/>

**6. Why apply patches/kie/kie-wb-common-examples-screen-backend-7.11.0.Final.patch**

This patch is for [kie-wb-common-examples-screen-backend](https://github.com/kiegroup/kie-wb-common/tree/7.11.0.Final/kie-wb-common-screens/kie-wb-common-examples-screen/kie-wb-common-examples-screen-backend). A new system property org.kie.wb.common.examples.dir is added and has privilege to user.dir property. This is a minor change you can ignore and use user.dir directly.

The code changed is:

```java
-            String userDir = System.getProperty("user.dir");
+            String userDir = System.getProperty("org.kie.wb.common.examples.dir");
+            if (userDir == null) {
+                userDir = System.getProperty("user.dir");
+            }
```

In the build.gradle of this plugin, the org.kie.wb.common.examples.dir is set:

```groovy
rootProject.jvmArguments.add('-Dorg.kie.wb.common.examples.dir=runtime/drools')
```

When running OFBiz, the kie workbench examples will be deployed under runtime/drools/.kie-wb-playground/:

![kie-wb-playground](docs/images/sandflower-kie-wb-playground.png)

<br/>

**7. Why apply patches/kie/kie-server-services-common-7.11.0.Final.patch**

In this plugin, the default kie server id is set to runtime/drools/ofbiz-kie-server:

```groovy
rootProject.jvmArguments.add('-Dorg.kie.server.id=runtime/drools/ofbiz-kie-server')
```

The ofbiz-kie-server.xml is expected to be auto-created during first startup and stored under runtime/drools/, afterwards loading configurations in new startup from it:

![runtime/drools/ofbiz-kie-server.xml](docs/images/sandflower-ofbiz-kie-server-xml.png)

And ofbiz-kie-server is expected as serverId so that it can be controlled in drools workbench:

![kie controller](docs/images/sandflower-kie-drools-wb-deploy.png)

The above scenario is the reason to create this patch.

According to [Tomcat document](https://tomcat.apache.org/tomcat-8.5-doc/class-loader-howto.html), there are 2 types of class loader:

```text
Therefore, from the perspective of a web application, class or resource loading looks in the following repositories, in this order:

Bootstrap classes of your JVM
/WEB-INF/classes of your web application
/WEB-INF/lib/*.jar of your web application
System class loader classes (described above)
Common class loader classes (described above)

If the web application class loader is configured with <Loader delegate="true"/> then the order becomes:

Bootstrap classes of your JVM
System class loader classes (described above)
Common class loader classes (described above)
/WEB-INF/classes of your web application
/WEB-INF/lib/*.jar of your web application
```

If your OFBiz is class loader type one, this patch is unnecessary as src/main/java/org/kie/server/services/impl/controller/DefaultRestControllerImpl.java will be built and deployed under /WEB-INF/classes.

If your OFBiz is type two and this is what I see in OFBiz 16.11.07, the patch can be applied to [droolsjbpm-integration/kie-server-parent/kie-server-services/kie-server-services-common](https://github.com/kiegroup/droolsjbpm-integration/tree/7.11.0.Final/kie-server-parent/kie-server-services/kie-server-services-common). The lib/kie-server-services-common-7.11.0.Final.jar is built with this patch.

<br/>

**8. Why gradle 4.9**

The gradle version in gradle/wrapper/gradle-wrapper.properties is 2.13. It has a problem to build Class-Path of MANIFEST.MF for ofbiz.jar correctly. In this case, it cannot resolve lucene version as expected. As we know, OFBiz use this Class-Path as classpath when starting. I happen to change 2.13 to 4.9 and it's ok. I guess many other gradle versions also work fine but I didn't try.

![kie controller](docs/images/sandflower-MANIFEST-MF.png)

<br/>

**9. Why lib/juel-impl-no-osgi-2.2.7.jar**

The original version of juel-impl-2.2.7.jar is included in build.gradle:

```groovy
    compile 'de.odysseus.juel:juel-impl:2.2.7'
```

and it contains a services.xml under OSGI-INFO, the xml content is:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<root xmlns:scr="http://www.osgi.org/xmlns/scr/v1.1.0">
    <scr:component name="de.odysseus.el.ExpressionFactoryImpl">
        <implementation class="de.odysseus.el.ExpressionFactoryImpl"/>
        <service>
            <provide interface="javax.el.ExpressionFactory"/>
        </service>
    </scr:component>
</root>
```

This OSGI config makes EL expressions in the jsp files error, so I unzipped the juel-impl-2.2.7.jar, removed OSGI-INFO and zip again, named the new jar to juel-impl-no-osgi-2.2.7.jar and placed it under lib folder. Then the jsp files work fine.

<br/>

Thanks for reading this document.

--- END ---
