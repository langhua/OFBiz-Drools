[English](README.md) | [Chinese](docs/README_ZH.md)

# OFBiz Drools Plugin

OFBiz Drools Plugin integrates [kie drools workbench](https://github.com/kiegroup/kie-wb-distributions) and [kie server](https://github.com/kiegroup/droolsjbpm-integration) into [OFBiz](https://github.com/apache/ofbiz).

This plugin is developed for [SandFlower project](https://github.com/SandFlower/) to make it an OOTB IOT/RFID product for small business end users to help them design/test/deploy differential prices or commissions, or duty work schedule and etc.

In short word, this plugin is a rule calculator.


### License
Apache License V2.0


### Contribution
Welcome any kind of contribution to this plugin.


### Quick Start
1. Checkout OFBiz 16.11.07 from http://svn.apache.org/repos/asf/ofbiz/tags/REL-16.11.07
2. Apply patches under patches/ofbiz to OFBiz
3. Download this plugin
4. Deploy this plugin in hot-deploy/drools/
5. Download gradle 4.9 and install. If you use gradlew, please edit gradle/wrapper/gradle-wrapper.properties, change to use gradle 4.9:

```
distributionUrl=https\://services.gradle.org/distributions/gradle-4.9-bin.zip
```

6. Install OFBiz seed data by command: 

```
gradle loadDefault
```

7. Start OFBiz by command:

```
gradle ofbiz
```

8. In browser, visit http://localhost:8080/kie-server/services/rest/server

Username: kieserver

Password: sandflower

After login successfully, you can see kie server information.

![kie server](docs/images/sandflower-kie-server.png)


9. In browser, visit https://localhost:8443/drools-wb/

Username: admin

Password: ofbiz

After login successfully, you can use drools workbench now.

10. Import a sample in Design, i.e. Mortgages and deploy it.

11. Add a kie-server named runtime/drools/ofbiz-kie-server in Deploy:

![kie controller](docs/images/sandflower-kie-drools-wb-deploy.png)
 
12. Verify any container is running by visiting http://localhost:8080/kie-server/services/rest/server/containers:

![kie server containers](docs/images/sandflower-kie-server-containers.png)

and check a specific container status by http://localhost:8080/kie-server/services/rest/server/containers/mortgages:mortgages:1.0.0-SNAPSHOT:

![kie server container](docs/images/sandflower-kie-server-container.png)

13. Call rules in a kie-server container in postman:

13.1. Set Auth to Basic Auth, Username: kieserver, Password: sandflower

![call rules in kie server: set Auth](docs/images/sandflower-kie-server-container-postman-Authorization.png)

13.2. Set Headers with Content-Type: application/json, X-KIE-ContentType: JSON, Accept: application/json

![call rules in kie server: set Headers](docs/images/sandflower-kie-server-container-postman-Headers.png)

13.3. Set Body in the post:

![call rules in kie server: set Body](docs/images/sandflower-kie-server-container-postman-Body.png)

13.4. Send the post request and get rule result

![call rules in kie server: Result](docs/images/sandflower-kie-server-container-postman-Result.png)


### Development Notes

1. How to build webapp/drools-wb-7.11.0.Final

1.1 Apply kie/kie-drools-wb-distribution-wars-7.11.0.Final.patch to [kie-wb-distributions/kie-drools-wb-parent/kie-drools-wb-distribution-wars/](https://github.com/kiegroup/kie-wb-distributions/tree/7.11.0.Final/kie-drools-wb-parent/kie-drools-wb-distribution-wars)

![apply patch to kie-drools-wb-distribution-wars](docs/images/sandflower-kie-drools-wb-distribution-wars-patch.png)

1.2 Run mvn package to build target/kie-drools-wb-7.11.0.Final-ofbiz, it's the webapp/drools-wb-7.11.0.Final

![build kie-drools-wb-7.11.0.Final-ofbiz](docs/images/sandflower-kie-drools-wb-distribution-wars-package.png)



2. How to build webapp/kie-server-7.11.0.Final



